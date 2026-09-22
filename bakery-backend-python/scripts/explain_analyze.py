import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import db


def run_explain_analyze():
    print("=====================================================")
    print("  Part 6: Query Optimization & EXPLAIN ANALYZE Demo  ")
    print("=====================================================\n")

    try:
        with db.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM products")
                row = cur.fetchone()
                current_count = int(row["count"])

                if current_count < 1000:
                    print(
                        f"Current product count is {current_count}. Seeding 3,000 sample products for realistic index benchmarking..."
                    )
                    cur.execute("""
                        INSERT INTO products (name, category_id, price, stock, description)
                        SELECT
                          'Product #' || g,
                          (1 + (g % 3)),
                          (10 + (g % 990))::numeric(10,2),
                          (g % 50),
                          'Benchmark description for product ' || g
                        FROM generate_series(1, 3000) AS g;
                    """)
                    conn.commit()
                    print("✅ 3,000 products seeded successfully!\n")

                test_query = """
                    SELECT p.id, p.name, p.price, c.name as category
                    FROM products p
                    JOIN categories c ON p.category_id = c.id
                    WHERE p.category_id = 2 AND p.price BETWEEN 200 AND 400
                    ORDER BY p.price;
                """

                print("Query being analyzed:")
                print(test_query.strip())
                print("\n-----------------------------------------------------")

                # 1. Forced Sequential Scan
                print("1. Query Plan WITHOUT Index (Forced Sequential Scan):")
                cur.execute("SET enable_seqscan = ON;")
                cur.execute("SET enable_indexscan = OFF;")
                cur.execute("SET enable_bitmapscan = OFF;")
                cur.execute(f"EXPLAIN (ANALYZE, BUFFERS) {test_query}")
                for r in cur.fetchall():
                    print("   ", r["QUERY PLAN"])

                # 2. Index Scan enabled
                print("\n2. Query Plan WITH Index (Index / Bitmap Index Scan):")
                cur.execute("SET enable_seqscan = OFF;")
                cur.execute("SET enable_indexscan = ON;")
                cur.execute("SET enable_bitmapscan = ON;")
                cur.execute(f"EXPLAIN (ANALYZE, BUFFERS) {test_query}")
                for r in cur.fetchall():
                    print("   ", r["QUERY PLAN"])

                # Reset settings
                cur.execute("RESET enable_seqscan;")
                cur.execute("RESET enable_indexscan;")
                cur.execute("RESET enable_bitmapscan;")
                conn.commit()

        print("\n-----------------------------------------------------")
        print("✅ EXPLAIN ANALYZE comparison completed successfully!")
        print("=====================================================\n")
    except Exception as err:
        print("Error during explain analyze:", err)
        sys.exit(1)


if __name__ == "__main__":
    run_explain_analyze()
