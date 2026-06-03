from decimal import Decimal
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    """Attach friendly product/customer names to the response."""
    out = schemas.OrderOut.model_validate(order)
    out.customer_name = order.customer.full_name if order.customer else None
    by_id = {item.id: item for item in order.items}
    for item_out in out.items:
        src = by_id.get(item_out.id)
        if src and src.product:
            item_out.product_name = src.product.name
    return out


def _load_order_or_404(db: Session, order_id: int) -> models.Order:
    order = (
        db.query(models.Order)
        .options(
            selectinload(models.Order.items).selectinload(models.OrderItem.product),
            selectinload(models.Order.customer),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )
    return order


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found",
        )

    # Reject duplicate product lines so stock math stays unambiguous.
    seen: set[int] = set()
    for item in payload.items:
        if item.product_id in seen:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Product {item.product_id} appears more than once; "
                "combine it into a single line",
            )
        seen.add(item.product_id)

    order = models.Order(customer_id=customer.id, total_amount=Decimal("0"))
    total = Decimal("0")

    for line in payload.items:
        # Lock the product row for the duration of the transaction so two
        # concurrent orders can't both pass the stock check and oversell.
        # (FOR UPDATE on Postgres; a no-op on SQLite, which serializes writes.)
        product = (
            db.query(models.Product)
            .filter(models.Product.id == line.product_id)
            .with_for_update()
            .first()
        )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {line.product_id} not found",
            )
        if product.quantity < line.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {line.quantity}, available {product.quantity}"
                ),
            )

        # Reduce stock and record the line at the current unit price.
        product.quantity -= line.quantity
        unit_price = Decimal(str(product.price))
        total += unit_price * line.quantity
        order.items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=line.quantity,
                unit_price=unit_price,
            )
        )

    order.total_amount = total
    db.add(order)
    db.commit()

    return _serialize_order(_load_order_or_404(db, order.id))


@router.get("", response_model=schemas.Page[schemas.OrderOut])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(func.count(models.Order.id)).scalar() or 0
    orders = (
        db.query(models.Order)
        .options(
            selectinload(models.Order.items).selectinload(models.OrderItem.product),
            selectinload(models.Order.customer),
        )
        .order_by(models.Order.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.Page(
        items=[_serialize_order(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total else 0,
    )


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return _serialize_order(_load_order_or_404(db, order_id))


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel/delete an order and restock the products it consumed."""
    order = _load_order_or_404(db, order_id)
    for item in order.items:
        if item.product:
            item.product.quantity += item.quantity
    db.delete(order)
    db.commit()
    return None
