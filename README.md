# 🥐 Home Bakery — Full-Stack Ordering System

An artisanal patisserie & bakery web application built with a **FastAPI + PostgreSQL** backend and a responsive **Vite + Vanilla JS & CSS** frontend.

---

## ✨ Features

- **Artisanal Product Catalog**: Browse fresh sourdough loaves, flaky croissants, chocolate cakes, and cookies with category filter pills, real-time search, and price range sliders.
- **Interactive Cart & Checkout**: Slide-out cart drawer with live quantity steppers, subtotal computation, and stock availability verification.
- **ACID Transactional Orders**: Backend ensures atomic checkout with PostgreSQL row-level locks (`FOR UPDATE OF p`), stock deduction, and order history tracking.
- **User Authentication**: Secure JWT authentication with role-based authorization (`CUSTOMER` vs `ADMIN`).
- **Executive Admin Dashboard**:
  - Live business KPIs (Gross Revenue, Completed Orders, Total Customers, Low-Stock Alerts).
  - Top-selling pastries ranking by units sold & gross revenue.
  - Monthly revenue aggregation.
  - Catalog management (add/delete products, create categories).
  - Order dispatch status manager (`PENDING` → `CONFIRMED` → `BAKING` → `DELIVERED`).
- **Performance Caching**: Redis caching on `/products/popular` with graceful in-memory fallback and catalog mutation invalidation.

---

## 📁 Repository Structure

```text
Home-Bakery/
├── bakery-backend-python/     # FastAPI, PostgreSQL, Redis, JWT backend
│   ├── config/                # Redis cache abstraction
│   ├── controllers/           # Auth, product, cart, order, analytics logic
│   ├── db/                    # PostgreSQL connection pool & schemas
│   ├── middleware/            # JWT auth & role dependencies
│   ├── routes/                # FastAPI router modules
│   ├── tests/                 # Automated test suite
│   ├── app.py                 # FastAPI application
│   ├── server.py              # Uvicorn entry point
│   └── requirements.txt
│
└── bakery-frontend/           # Modern responsive web application
    ├── public/assets/         # Artisanal bakery photography
    ├── src/
    │   ├── api.js             # API client with token authorization
    │   ├── auth.js            # User state & auth modals
    │   ├── cart.js            # Slide-over cart drawer & checkout
    │   ├── orders.js          # Order tracking & progress stepper
    │   ├── admin.js           # Admin dashboard & analytics
    │   ├── toast.js           # Toast notifications
    │   ├── style.css          # Artisanal CSS design system
    │   └── main.js            # App orchestrator & reactive filters
    ├── index.html             # Semantic accessible layout
    ├── vite.config.js         # Zero-CORS backend proxy
    └── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **PostgreSQL 14+**

### 2. Backend Setup
```bash
cd bakery-backend-python

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (copy and edit if needed)
cp .env.example .env

# Run the backend server
python server.py
```
> Server runs on [http://localhost:8000](http://localhost:8000)  
> Interactive OpenAPI documentation available at [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
cd bakery-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> App runs on [http://localhost:5173](http://localhost:5173)

---

## 📜 License
ISC
