# Inventory & Order Management System

A full-stack, containerized application for managing **products, customers, orders, and inventory**.

- **Frontend:** React (Vite) + React Router — responsive dashboard UI
- **Backend:** Python + FastAPI — REST API with validation and business rules
- **Database:** PostgreSQL
- **Containerization:** Docker + Docker Compose (3 services)
- **Deployment:** Backend → Render, Frontend → Vercel

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Run Locally with Docker Compose](#run-locally-with-docker-compose-recommended)
5. [Run Without Docker](#run-without-docker-dev-mode)
6. [API Reference](#api-reference)
7. [Business Rules](#business-rules)
8. [Deployment](#deployment)
9. [Submission Checklist](#submission-checklist)

---

## Features

**Products** — create, list, view, update, delete. Unique SKU, non-negative price/stock.
**Customers** — create, list, view, delete. Unique email.
**Orders** — create (multi-product), list, view details, cancel. Stock-aware with auto totals.
**Dashboard** — totals for products / customers / orders plus a low-stock list.

The UI is responsive (desktop + mobile), validates forms client-side, and shows clear
success/error banners. The backend re-validates everything and returns proper HTTP status codes.

---

## Architecture

```
┌──────────────┐        HTTP/JSON        ┌──────────────┐      SQL       ┌──────────────┐
│   Frontend   │ ──────────────────────▶ │   Backend    │ ─────────────▶ │  PostgreSQL  │
│ React + Vite │                         │   FastAPI    │                │              │
│ (nginx :80)  │ ◀────────────────────── │   (:8000)    │ ◀───────────── │   (:5432)    │
└──────────────┘                         └──────────────┘                └──────────────┘
```

---

## Project Structure

```
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration, table creation
│   │   ├── config.py        # env-driven settings (Pydantic)
│   │   ├── database.py      # SQLAlchemy engine/session + get_db dependency
│   │   ├── models.py        # Product, Customer, Order, OrderItem
│   │   ├── schemas.py       # Pydantic request/response models (validation)
│   │   └── routers/         # products, customers, orders, dashboard
│   ├── requirements.txt
│   ├── Dockerfile           # python:3.12-slim, non-root user
│   ├── .dockerignore
│   └── .env.example
├── frontend/                  # Vite + React + Tailwind v4
│   ├── src/
│   │   ├── api/client.js      # API client (backend endpoint paths + paginated list methods + fetch-all)
│   │   ├── constants/         # urls.js (frontend route paths) + per-domain *-data.js (static config)
│   │   ├── utils/             # cn (clsx+tailwind-merge), formatCurrency
│   │   ├── hooks/             # useApi, usePaginatedApi, useConfirm
│   │   ├── components/
│   │   │   ├── UI/            # Table, Pagination, Field, Badge, Button, Modal, ConfirmDialog
│   │   │   ├── Layout/        # Sidebar, Topbar
│   │   │   ├── Products/      # ProductFormModal
│   │   │   ├── Customers/     # CustomerFormModal
│   │   │   ├── Orders/        # CreateOrderModal, OrderDetailModal
│   │   │   └── Dashboard/     # StatCard
│   │   ├── pages/             # Dashboard.jsx, Products.jsx, Customers.jsx, Orders.jsx (one file per page)
│   │   ├── App.jsx            # lazy routes + Suspense + Toaster
│   │   ├── main.jsx, index.css
│   ├── Dockerfile            # multi-stage: node build → nginx:alpine
│   ├── nginx.conf            # SPA fallback
│   ├── vercel.json
│   ├── .dockerignore
│   └── .env.example
├── docker-compose.yml        # db + backend + frontend
├── render.yaml               # backend deploy blueprint
├── .env.example              # root env for docker-compose
├── .gitignore
└── README.md
```

---

## Run Locally with Docker Compose (recommended)

> Requires Docker + Docker Compose.

```bash
cd inventory-order-system

# 1. Create your env file from the template (credentials live here, not in code)
cp .env.example .env
#    edit .env and set a real POSTGRES_PASSWORD

# 2. Build and start all three services
docker compose up --build
```

Then open:

| Service        | URL                              |
| -------------- | -------------------------------- |
| Frontend (UI)  | http://localhost:5173            |
| Backend API    | http://localhost:8000            |
| API docs (Swagger) | http://localhost:8000/docs   |

PostgreSQL data persists in the named volume `pgdata` across restarts.

Stop with `Ctrl+C`; remove containers with `docker compose down` (add `-v` to also wipe the DB volume).

---

## Run Without Docker (dev mode)

Useful if you don't have Docker installed. You need Python 3.12, Node 20, and a PostgreSQL
instance (or change `DATABASE_URL` to a local SQLite URL like `sqlite:///./dev.db` for a quick try).

**Backend**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/inventory"
export CORS_ORIGINS="http://localhost:5173"
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL defaults to http://localhost:8000
npm run dev                 # http://localhost:5173
```

---

## API Reference

Base URL: `http://localhost:8000`. Interactive docs at `/docs`.

### Pagination

The list endpoints (`GET /products`, `GET /customers`, `GET /orders`) are
**server-side paginated**. They accept query params and return an envelope:

| Param       | Default | Constraint | Description           |
| ----------- | ------- | ---------- | --------------------- |
| `page`      | `1`     | ≥ 1        | 1-based page number   |
| `page_size` | `10`    | 1–100      | items per page        |

```jsonc
// GET /products?page=1&page_size=10
{
  "items": [ /* ...ProductOut... */ ],
  "total": 57,        // total matching records
  "page": 1,
  "page_size": 10,
  "pages": 6          // total number of pages
}
```

Out-of-range pages return an empty `items` array; invalid params return `422`.
`GET /{id}`, create/update/delete, and `/dashboard/summary` are **not** paginated.

### Products
| Method | Path             | Description                  |
| ------ | ---------------- | ---------------------------- |
| POST   | `/products`      | Create a product             |
| GET    | `/products`      | List products (paginated)    |
| GET    | `/products/{id}` | Get one product              |
| PUT    | `/products/{id}` | Update a product             |
| DELETE | `/products/{id}` | Delete a product             |

```jsonc
// POST /products
{ "name": "Keyboard", "sku": "KB-100", "price": 49.99, "quantity": 25 }
```

### Customers
| Method | Path              | Description         |
| ------ | ----------------- | ------------------- |
| POST   | `/customers`      | Create a customer            |
| GET    | `/customers`      | List customers (paginated)   |
| GET    | `/customers/{id}` | Get one customer             |
| DELETE | `/customers/{id}` | Delete a customer            |

```jsonc
// POST /customers
{ "full_name": "Jane Doe", "email": "jane@example.com", "phone": "+1-555-0100" }
```

### Orders
| Method | Path           | Description                       |
| ------ | -------------- | --------------------------------- |
| POST   | `/orders`      | Create an order (reduces stock)   |
| GET    | `/orders`      | List orders (paginated)           |
| GET    | `/orders/{id}` | Get order details                 |
| DELETE | `/orders/{id}` | Cancel an order (restores stock)  |

```jsonc
// POST /orders  — total_amount is computed by the backend
{ "customer_id": 1, "items": [ { "product_id": 1, "quantity": 2 } ] }
```

### Dashboard
| Method | Path                  | Description                                     |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/dashboard/summary`  | Totals + low-stock products                     |

---

## Business Rules

All enforced in the backend (and mirrored in DB constraints where possible):

- ✅ Product SKU is **unique** → `409 Conflict` on duplicate.
- ✅ Customer email is **unique** → `409 Conflict` on duplicate.
- ✅ Product quantity **cannot be negative** → `422` on invalid input + DB `CHECK` constraint.
- ✅ Orders are **rejected if stock is insufficient** → `409 Conflict`.
- ✅ Creating an order **automatically reduces stock**; cancelling **restores** it.
- ✅ Order `total_amount` is **calculated by the backend** from current product prices.
- ✅ All input is **validated** (Pydantic) → `422` with field-level messages.
- ✅ Proper status codes throughout: `201` create, `204` delete, `404` not found, `409` conflict, `422` validation.

---

## Deployment

### Backend → Render (Docker)

1. Push this repo to GitHub.
2. On [Render](https://render.com): **New → Blueprint**, point it at the repo. `render.yaml`
   provisions a free PostgreSQL database and a Docker web service from `backend/`.
   *(Or do it manually: **New → Web Service**, runtime **Docker**, root directory `backend`.)*
3. Set environment variables on the backend service:
   - `DATABASE_URL` = the database's **Internal Database URL**, with the scheme changed from
     `postgresql://` to **`postgresql+psycopg://`** (the driver this app uses).
   - `CORS_ORIGINS` = your Vercel frontend URL (e.g. `https://your-app.vercel.app`).
   - `LOW_STOCK_THRESHOLD` = `10` (optional).
4. Deploy. Your API is at `https://<service>.onrender.com` (docs at `/docs`).

> Render's free tier sleeps after inactivity; the first request after idle may take ~30s.

### Frontend → Vercel

1. On [Vercel](https://vercel.com): **Add New → Project**, import the repo.
2. Set **Root Directory** to `frontend`. Vercel auto-detects Vite (`vercel.json` is included).
3. Add an environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://<service>.onrender.com`).
4. Deploy. Your UI is at `https://<app>.vercel.app`.
5. **Important:** make sure the backend's `CORS_ORIGINS` includes this exact Vercel URL, then
   redeploy the backend if you changed it.

### Backend image → Docker Hub

```bash
cd backend
docker build -t <your-dockerhub-username>/inventory-backend:latest .
docker login
docker push <your-dockerhub-username>/inventory-backend:latest
```

Image link: `https://hub.docker.com/r/<your-dockerhub-username>/inventory-backend`

---

## Submission Checklist

- [ ] GitHub repository link (frontend + backend)
- [ ] Docker Hub image link for the backend
- [ ] Live frontend URL (Vercel)
- [ ] Live backend API URL (Render, e.g. `.../docs`)
- [ ] `CORS_ORIGINS` on the backend includes the live frontend URL
- [ ] `VITE_API_BASE_URL` on the frontend points to the live backend URL
```

> **Security note:** no credentials are hardcoded. All secrets come from environment variables
> / `.env` files, and `.env` is gitignored. Use strong values in production.
