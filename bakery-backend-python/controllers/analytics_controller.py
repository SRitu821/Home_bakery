import logging
from fastapi.responses import JSONResponse
import db

logger = logging.getLogger("analytics_controller")


def get_top_selling() -> JSONResponse:
    try:
        result = db.query("""
            SELECT p.id, p.name, c.name AS category, p.price,
                   COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
                   ROUND(COALESCE(SUM(oi.quantity * oi.price), 0), 2) AS total_revenue
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'CANCELLED'
            GROUP BY p.id, c.name
            ORDER BY total_revenue DESC, units_sold DESC
            LIMIT 10;
        """)
        return JSONResponse(status_code=200, content=result.rows)
    except Exception as err:
        logger.error(f"getTopSelling error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching top-selling analytics"})


def get_monthly_revenue() -> JSONResponse:
    try:
        result = db.query("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COUNT(id)::int AS total_orders,
                ROUND(SUM(total_amount), 2) AS gross_revenue
            FROM orders
            WHERE status IN ('DELIVERED', 'CONFIRMED', 'BAKING')
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC;
        """)
        return JSONResponse(status_code=200, content=result.rows)
    except Exception as err:
        logger.error(f"getMonthlyRevenue error: {err}")
        return JSONResponse(
            status_code=500,
            content={"error": "Something went wrong fetching monthly revenue analytics"},
        )


def get_overview() -> JSONResponse:
    try:
        rev_res = db.query("""
            SELECT ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue,
                   COUNT(id)::int AS completed_orders
            FROM orders
            WHERE status IN ('DELIVERED', 'CONFIRMED', 'BAKING');
        """)

        user_res = db.query("""
            SELECT COUNT(id)::int AS total_customers
            FROM users
            WHERE role = 'CUSTOMER';
        """)

        low_stock_res = db.query("""
            SELECT COUNT(id)::int AS low_stock_count
            FROM products
            WHERE stock < 5;
        """)

        return JSONResponse(
            status_code=200,
            content={
                "total_revenue": rev_res.rows[0]["total_revenue"],
                "completed_orders": rev_res.rows[0]["completed_orders"],
                "total_customers": user_res.rows[0]["total_customers"],
                "low_stock_products": low_stock_res.rows[0]["low_stock_count"],
            },
        )
    except Exception as err:
        logger.error(f"getOverview error: {err}")
        return JSONResponse(status_code=500, content={"error": "Something went wrong fetching overview analytics"})
