#!/usr/bin/env python3
"""Seed the Inventory & Order Management API with realistic demo data.

Talks to the running HTTP API (no database credentials needed), so it works
against local dev, docker-compose, or the deployed backend alike. Because it
speaks plain HTTP it is unaffected by CORS (that only governs browsers).

Usage:
    # Local dev / docker-compose (backend on :8000)
    python seed_demo.py

    # Deployed backend
    python seed_demo.py --base-url https://your-backend.onrender.com
    # or
    BASE_URL=https://your-backend.onrender.com python seed_demo.py

    # Wipe existing data first, then seed a clean demo set
    python seed_demo.py --reset

The data is shaped to make the product look *used* on first load:
a stocked catalogue, several customers, a spread of orders, and a handful
of deliberately low-stock items so the dashboard's "low stock" card lights up.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

# A tech / office-equipment distributor catalogue. SKUs follow a
# CATEGORY-ITEM-NNN convention so the table reads like a real inventory.
# Four items are seeded at or below the default low-stock threshold (10)
# so the dashboard surfaces them immediately.
PRODUCTS = [
    {"name": "Wireless Optical Mouse",        "sku": "ACC-MOU-001", "price": 24.99,  "quantity": 120},
    {"name": "Mechanical Keyboard (RGB)",     "sku": "ACC-KEY-002", "price": 79.50,  "quantity": 64},
    {"name": "USB-C 7-in-1 Hub",              "sku": "ACC-HUB-003", "price": 39.99,  "quantity": 8},   # low
    {"name": '27" 4K Monitor',                "sku": "DSP-MON-004", "price": 329.00, "quantity": 22},
    {"name": "Aluminium Laptop Stand",        "sku": "ACC-STD-005", "price": 45.00,  "quantity": 5},   # low
    {"name": "1080p Webcam",                  "sku": "ACC-CAM-006", "price": 59.99,  "quantity": 40},
    {"name": "Noise-Cancelling Headset",      "sku": "AUD-HSD-007", "price": 149.99, "quantity": 30},
    {"name": "LED Desk Lamp",                 "sku": "OFF-LMP-008", "price": 34.95,  "quantity": 75},
    {"name": "Ergonomic Office Chair",        "sku": "OFF-CHR-009", "price": 219.00, "quantity": 18},
    {"name": "Standing Desk Converter",       "sku": "OFF-DSK-010", "price": 159.00, "quantity": 9},   # low
    {"name": "HDMI 2.1 Cable (2m)",           "sku": "CBL-HDM-011", "price": 12.99,  "quantity": 200},
    {"name": "6-Outlet Surge Protector",      "sku": "PWR-SRG-012", "price": 22.50,  "quantity": 90},
    {"name": "External SSD 1TB",              "sku": "STO-SSD-013", "price": 109.99, "quantity": 35},
    {"name": "15W Wireless Charger",          "sku": "PWR-CHG-014", "price": 29.99,  "quantity": 7},   # low
    {"name": "Bluetooth Speaker",             "sku": "AUD-SPK-015", "price": 64.00,  "quantity": 48},
]

CUSTOMERS = [
    {"full_name": "Acme Supplies Pvt Ltd",  "email": "orders@acmesupplies.example",    "phone": "+91 98765 43210"},
    {"full_name": "TechNova Solutions",      "email": "procurement@technova.example",   "phone": "+91 91234 56780"},
    {"full_name": "BlueOrbit Retail",        "email": "buying@blueorbit.example",       "phone": "+1 415 555 0142"},
    {"full_name": "Meridian Office Co",      "email": "accounts@meridianoffice.example","phone": "+44 20 7946 0991"},
    {"full_name": "Riverside Traders",       "email": "hello@riversidetraders.example", "phone": "+91 99887 76655"},
    {"full_name": "Summit Distributors",     "email": "ops@summitdist.example",         "phone": "+1 212 555 0188"},
    {"full_name": "Lakeside Ventures",       "email": "contact@lakesideventures.example","phone": "+91 90909 80808"},
]

# Orders reference customers by email and products by SKU so this list stays
# readable and independent of the IDs the server assigns. Quantities are kept
# within available stock (and low-stock items are ordered lightly so they
# stay low rather than overselling).
#
# Each row is (email, lines, status, days_ago). Dates are spread across the
# last ~4 weeks (oldest first) and statuses progress from a settled history
# (older = Delivered/Shipped) to fresh activity (recent = Processing/Pending).
ORDERS = [
    ("orders@acmesupplies.example",     [("ACC-MOU-001", 10), ("ACC-KEY-002", 5),  ("CBL-HDM-011", 20)], "Delivered",  28),
    ("procurement@technova.example",    [("DSP-MON-004", 2),  ("ACC-CAM-006", 4),  ("STO-SSD-013", 3)],  "Delivered",  24),
    ("buying@blueorbit.example",        [("AUD-HSD-007", 6),  ("AUD-SPK-015", 8)],                       "Delivered",  20),
    ("accounts@meridianoffice.example", [("OFF-CHR-009", 3),  ("OFF-LMP-008", 10), ("PWR-SRG-012", 12)], "Shipped",    16),
    ("hello@riversidetraders.example",  [("ACC-MOU-001", 15), ("CBL-HDM-011", 30)],                      "Delivered",  12),
    ("ops@summitdist.example",          [("STO-SSD-013", 5),  ("ACC-CAM-006", 6),  ("PWR-CHG-014", 1)],  "Shipped",     9),
    ("contact@lakesideventures.example",[("AUD-SPK-015", 5),  ("OFF-LMP-008", 8)],                       "Processing",  5),
    ("orders@acmesupplies.example",     [("ACC-KEY-002", 4),  ("DSP-MON-004", 1)],                       "Pending",     2),
    ("procurement@technova.example",    [("AUD-HSD-007", 3),  ("ACC-MOU-001", 6)],                       "Pending",     1),
]

# After placing the orders, cancel one older order (by its 1-based position in
# ORDERS above) so the demo shows a Cancelled chip and exercises the restock
# path. Position 3 is the 20-day-old BlueOrbit order.
CANCEL_ORDER_POSITION = 3


class ApiError(Exception):
    pass


def request(base_url: str, method: str, path: str, body: dict | None = None) -> dict | list | None:
    url = base_url.rstrip("/") + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise ApiError(f"{method} {path} -> {err.code}: {detail}") from err
    except urllib.error.URLError as err:
        raise ApiError(f"Cannot reach {url}: {err.reason}") from err


def list_all(base_url: str, path: str) -> list[dict]:
    """Page through a list endpoint and return every item."""
    items: list[dict] = []
    page = 1
    while True:
        result = request(base_url, "GET", f"{path}?page={page}&page_size=100")
        batch = result.get("items", []) if isinstance(result, dict) else []
        items.extend(batch)
        if not isinstance(result, dict) or page >= (result.get("pages") or 0):
            break
        page += 1
    return items


def reset(base_url: str) -> None:
    print("Resetting existing data...")
    for order in list_all(base_url, "/orders"):
        request(base_url, "DELETE", f"/orders/{order['id']}")
    for product in list_all(base_url, "/products"):
        request(base_url, "DELETE", f"/products/{product['id']}")
    for customer in list_all(base_url, "/customers"):
        request(base_url, "DELETE", f"/customers/{customer['id']}")
    print("  cleared orders, products, and customers")


def seed(base_url: str) -> None:
    # Products (keyed by SKU for the order step).
    product_id_by_sku: dict[str, int] = {}
    for p in PRODUCTS:
        created = request(base_url, "POST", "/products", p)
        product_id_by_sku[p["sku"]] = created["id"]
    print(f"  created {len(product_id_by_sku)} products")

    # Customers (keyed by email for the order step).
    customer_id_by_email: dict[str, int] = {}
    for c in CUSTOMERS:
        created = request(base_url, "POST", "/customers", c)
        customer_id_by_email[c["email"]] = created["id"]
    print(f"  created {len(customer_id_by_email)} customers")

    # Orders. Backdate created_at so the history spans the last few weeks and
    # carry the per-order status. Keep the created ids so we can cancel one.
    now = datetime.now(timezone.utc)
    order_ids: list[int] = []
    for email, lines, status, days_ago in ORDERS:
        created_at = (now - timedelta(days=days_ago, hours=9)).isoformat()
        payload = {
            "customer_id": customer_id_by_email[email],
            "status": status,
            "created_at": created_at,
            "items": [
                {"product_id": product_id_by_sku[sku], "quantity": qty}
                for sku, qty in lines
            ],
        }
        created = request(base_url, "POST", "/orders", payload)
        order_ids.append(created["id"])
    print(f"  placed {len(order_ids)} orders")

    # Cancel one older order via the status endpoint (keeps the row, restocks).
    cancel_id = order_ids[CANCEL_ORDER_POSITION - 1]
    request(base_url, "PATCH", f"/orders/{cancel_id}", {"status": "Cancelled"})
    print(f"  cancelled order #{cancel_id}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed demo data into the inventory API.")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("BASE_URL", "http://localhost:8000"),
        help="Base URL of the running backend (default: $BASE_URL or http://localhost:8000)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all existing orders/products/customers before seeding.",
    )
    args = parser.parse_args()
    base_url = args.base_url

    print(f"Target: {base_url}")
    try:
        # Sanity check + wake a sleeping free-tier host before we start.
        request(base_url, "GET", "/health")

        if args.reset:
            reset(base_url)
        else:
            existing = request(base_url, "GET", "/products?page=1&page_size=1")
            if isinstance(existing, dict) and existing.get("total"):
                print(
                    f"Refusing to seed: {existing['total']} products already exist.\n"
                    "Re-run with --reset to wipe and reseed."
                )
                return 1

        print("Seeding...")
        seed(base_url)
    except ApiError as err:
        print(f"\nERROR: {err}", file=sys.stderr)
        return 1

    print("\nDone. Open the dashboard to see populated stats and low-stock items.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
