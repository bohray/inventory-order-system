from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.database import Base, engine
from app.routers import customers, dashboard, orders, products

settings = get_settings()

# Create tables on startup. For a real product this would be Alembic
# migrations; for this assessment create_all keeps setup zero-config.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
    description="Manage products, customers, orders and inventory.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Convert uncaught DB constraint violations into a clean 409."""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database constraint violated"},
    )


@app.get("/", tags=["health"])
def root():
    return {"service": "inventory-order-management", "status": "ok"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
