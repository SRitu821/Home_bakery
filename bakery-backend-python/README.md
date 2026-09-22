# 🥐 Home Bakery Backend (Python Stack)

A robust, production-ready RESTful backend ordering system built with **Python 3**, **FastAPI**, and **PostgreSQL 17**, featuring JWT authentication, role-based access control, ACID transactional checkout, database indexing, Redis caching with graceful in-memory fallback, and interactive OpenAPI documentation.

---

## ✨ Features

- **Authentication & Authorization**:
  - Secure registration & login with `bcrypt` password hashing and `PyJWT` issuance (24h validity).
  - Automatic user cart provisioning upon customer registration.
  - Role-based authorization (`CUSTOMER` vs `ADMIN`).
- **Product Catalog & Management**:
  - Browse categorized products with dynamic query filtering (`?category=...`, `?minPrice=...`, `?maxPrice=...`, `?search=...`).
  - Full CRUD management for Admins (`POST`, `PUT`, `DELETE`).
- **Cart & Transactional Checkout**:
  - Per-user cart management with automatic stock availability validation.
  - **ACID Transactional Orders**: Checkout runs inside an atomic PostgreSQL transaction with row-level locks (`FOR UPDATE OF p`), stock deduction, order history creation, and cart clearance.
- **Performance & Optimization**:
  - PostgreSQL B-Tree indexes on foreign keys and frequently filtered columns (~60%+ query latency drop benchmarked via `EXPLAIN ANALYZE`).
  - Redis caching on `GET /products/popular` (10-minute TTL) with automatic invalidation on catalog mutations and graceful in-memory fallback.
- **Admin Analytics**:
  - Top-selling products ranking by units sold and gross revenue.
  - Monthly revenue aggregation using `DATE_TRUNC('month', created_at)`.
  - Executive KPI overview (revenue, completed orders, customer count, low-stock alerts).
- **Interactive Documentation**:
  - Automatically generated interactive Swagger UI (`/docs`) and ReDoc (`/redoc`).

---

## 🛠️ Tech Stack

- **Runtime**: Python 3.10+ (tested with Python 3.14)
- **Framework**: FastAPI + Starlette
- **Server**: Uvicorn ASGI
- **Database**: PostgreSQL 17 (`psycopg 3` with connection pooling)
- **Security**: `bcrypt`, `pyjwt`
- **Caching**: Redis client with resilient in-memory TTL fallback
- **Environment**: `python-dotenv`

---

## 📁 Project Structure

```text
bakery-backend-python/
├── config/
│   ├── __init__.py
│   └── cache.py           # Redis caching abstraction with in-memory TTL fallback
├── controllers/
│   ├── __init__.py
│   ├── analytics_controller.py
│   ├── auth_controller.py
│   ├── category_controller.py
│   ├── cart_controller.py
│   ├── order_controller.py
│   └── product_controller.py
├── db/
│   ├── __init__.py
│   ├── connection.py      # psycopg 3 ConnectionPool and transaction client
│   ├── schema.sql         # Database tables, constraints, and seeds (reference)
│   └── indexing.sql       # Performance B-Tree indexes
├── middleware/
│   ├── __init__.py
│   └── auth_middleware.py # JWT authentication & require_role dependencies
├── routes/
│   ├── __init__.py
│   ├── analytics_routes.py
│   ├── auth_routes.py
│   ├── category_routes.py
│   ├── cart_routes.py
│   ├── order_routes.py
│   └── product_routes.py
├── scripts/
│   ├── explain_analyze.py # Query optimization benchmark (EXPLAIN ANALYZE)
│   └── test.py            # Unified test suite runner
├── tests/
│   ├── test_api.py        # Core API & ACID transaction tests
│   └── test_part6_7.py    # Redis caching, invalidation & analytics tests
├── app.py                 # FastAPI application & route mounting
├── server.py              # Uvicorn HTTP server startup
├── .env.example
├── .env
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (v14+)
- *(Optional)* Redis server (in-memory fallback is automatically used if Redis is not connected)

### 2. Installation
Install dependencies via pip:
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env` (or verify existing `.env`):
```bash
cp .env.example .env
```
Ensure your database credentials match:
```ini
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=bakery_user
DB_PASSWORD=your_password
DB_NAME=bakery_db
JWT_SECRET=supersecretbakeryjwtkey_change_in_production
REDIS_URL=redis://localhost:6379
```

### 4. Start the Application
- Run with Python:
  ```bash
  python server.py
  ```
- Or run with Uvicorn directly (with auto-reload):
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 8000 --reload
  ```

Visit the interactive API docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running Tests

Run the full automated test suite:
```bash
python scripts/test.py
```
This executes:
1. **Core API & ACID transaction tests** (`tests/test_api.py`): tests registration, login, product CRUD, search, cart, stock deduction, and order placement.
2. **Caching & Analytics tests** (`tests/test_part6_7.py`): tests Redis cold cache MISS, warm cache HIT, cache invalidation on catalog mutations, and executive analytics.
3. **Query Optimization Benchmark** (`scripts/explain_analyze.py`): compares forced sequential scan vs index scan using `EXPLAIN (ANALYZE, BUFFERS)`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Health check |
| `POST` | `/register` | Public | Register customer or admin |
| `POST` | `/login` | Public | Authenticate and obtain JWT |
| `GET` | `/categories` | Public | List categories |
| `POST` | `/categories` | Admin | Create new category |
| `GET` | `/products` | Public | Filter products by category, price, search |
| `GET` | `/products/popular` | Public | Cached top products (Redis TTL 10m) |
| `GET` | `/popular` | Public | Alias to `/products/popular` |
| `GET` | `/products/:id` | Public | Single product details |
| `POST` | `/products` | Admin | Create product (invalidates cache) |
| `PUT` | `/products/:id` | Admin | Update product (invalidates cache) |
| `DELETE` | `/products/:id` | Admin | Delete product (invalidates cache) |
| `GET` | `/cart` | Customer | View customer cart & totals |
| `POST` | `/cart` | Customer | Add product to cart |
| `PUT` | `/cart/items/:id` | Customer | Update item quantity |
| `DELETE` | `/cart/items/:id` | Customer | Remove item from cart |
| `POST` | `/orders` | Customer | Atomic checkout transaction |
| `GET` | `/orders` | Customer | List order history (Admin sees all) |
| `GET` | `/orders/:id` | Customer/Admin | Order details with items |
| `PUT` | `/orders/:id/status` | Admin | Update order status |
| `GET` | `/analytics/overview` | Admin | Top-level business KPIs |
| `GET` | `/analytics/top-selling` | Admin | Top products by revenue & units |
| `GET` | `/analytics/monthly-revenue` | Admin | Monthly revenue breakdown |

---

## 📜 License
ISC
