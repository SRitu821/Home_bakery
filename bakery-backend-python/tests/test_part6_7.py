import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import time
import socket
import threading
import requests
import uvicorn
from app import app
from config.cache import cache


def get_free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def run_part6_and_7_tests():
    print("=====================================================")
    print("  Testing Part 6 & Part 7 (Caching, Analytics & Auth) ")
    print("=====================================================\n")

    port = get_free_port()
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    base_url = f"http://127.0.0.1:{port}"

    # Wait for server to start
    for _ in range(50):
        try:
            r = requests.get(f"{base_url}/health", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(0.1)
    else:
        print("❌ Test server failed to start")
        sys.exit(1)

    print(f"Test server running on port {port}")

    try:
        timestamp = int(time.time() * 1000)
        admin_email = f"admin_part7_{timestamp}@bakery.com"
        customer_email = f"customer_part7_{timestamp}@bakery.com"

        # 1. Register Admin & Customer
        admin_res = requests.post(
            f"{base_url}/register",
            json={
                "name": "Head Baker",
                "email": admin_email,
                "password": "adminpassword123",
                "role": "ADMIN",
            },
        )
        admin_token = admin_res.json()["token"]

        cust_res = requests.post(
            f"{base_url}/register",
            json={
                "name": "Cake Lover",
                "email": customer_email,
                "password": "customerpass123",
            },
        )
        customer_token = cust_res.json()["token"]

        # 2. Test GET /products/popular (Cold Cache - Cache MISS)
        print("\n--- 1. Testing GET /products/popular (Cache MISS) ---")
        cache.delete("popular_products")
        pop_miss = requests.get(f"{base_url}/products/popular")
        miss_body = pop_miss.json()
        miss_cache_hdr = pop_miss.headers.get("x-cache") or pop_miss.headers.get("X-Cache")
        print(f"Status: {pop_miss.status_code}, Source: {miss_body.get('source')}, X-Cache header: {miss_cache_hdr}")
        print("Products returned:", len(miss_body.get("data", [])))
        assert pop_miss.status_code == 200, "Cold cache status not 200"
        assert miss_body.get("source") == "database", "Expected source 'database'"
        assert miss_cache_hdr == "MISS", f"Expected X-Cache MISS, got {miss_cache_hdr}"

        # 3. Test GET /products/popular (Warm Cache - Cache HIT)
        print("\n--- 2. Testing GET /products/popular (Cache HIT) ---")
        pop_hit = requests.get(f"{base_url}/products/popular")
        hit_body = pop_hit.json()
        hit_cache_hdr = pop_hit.headers.get("x-cache") or pop_hit.headers.get("X-Cache")
        print(f"Status: {pop_hit.status_code}, Source: {hit_body.get('source')}, X-Cache header: {hit_cache_hdr}")
        assert pop_hit.status_code == 200, "Warm cache status not 200"
        assert hit_body.get("source") == "cache", "Expected source 'cache'"
        assert hit_cache_hdr == "HIT", f"Expected X-Cache HIT, got {hit_cache_hdr}"

        # 4. Test Cache Invalidation on Admin Mutation
        print("\n--- 3. Testing Cache Invalidation on Admin Mutation ---")
        prod_res = requests.post(
            f"{base_url}/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": f"Red Velvet Special {timestamp}",
                "category_id": 1,
                "price": 499,
                "stock": 50,
                "description": "Velvety cream cheese layers with generous stock",
            },
        )
        target_product = prod_res.json()

        # Next call must be MISS
        pop_inv = requests.get(f"{base_url}/products/popular")
        inv_body = pop_inv.json()
        inv_cache_hdr = pop_inv.headers.get("x-cache") or pop_inv.headers.get("X-Cache")
        print(f"After mutation source: {inv_body.get('source')}, X-Cache header: {inv_cache_hdr}")
        assert pop_inv.status_code == 200, "Invalidated cache status not 200"
        assert inv_body.get("source") == "database", "Expected source 'database' after mutation"
        assert inv_cache_hdr == "MISS", f"Expected X-Cache MISS, got {inv_cache_hdr}"

        # 5. Customer creates order to generate analytics data
        print("\n--- 4. Creating order to populate analytics ---")
        add_cart_res = requests.post(
            f"{base_url}/cart",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": target_product["id"], "quantity": 2},
        )
        print("Cart add status:", add_cart_res.status_code)

        order_res = requests.post(
            f"{base_url}/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={},
        )
        print("Order create status:", order_res.status_code)
        order_id = order_res.json()["order"]["id"]

        # Admin delivers order
        status_res = requests.put(
            f"{base_url}/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "DELIVERED"},
        )
        print(f"Order #{order_id} marked as DELIVERED:", status_res.json().get("order", {}).get("status"))

        # 6. Test Admin Analytics Endpoints
        print("\n--- 5. Testing GET /analytics/overview (Admin) ---")
        overview = requests.get(
            f"{base_url}/analytics/overview",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        print("Overview KPIs:", overview.json())
        assert overview.status_code == 200, "Overview status not 200"
        assert "total_revenue" in overview.json(), "total_revenue missing from overview"

        print("\n--- 6. Testing GET /analytics/top-selling (Admin) ---")
        top_selling = requests.get(
            f"{base_url}/analytics/top-selling",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        print("Top Selling count:", len(top_selling.json()), "Top Item:", top_selling.json()[0] if top_selling.json() else None)
        assert top_selling.status_code == 200, "Top selling status not 200"
        assert len(top_selling.json()) > 0, "Expected at least 1 top selling item"

        print("\n--- 7. Testing GET /analytics/monthly-revenue (Admin) ---")
        monthly_rev = requests.get(
            f"{base_url}/analytics/monthly-revenue",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        print("Monthly Revenue records:", monthly_rev.json())
        assert monthly_rev.status_code == 200, "Monthly revenue status not 200"
        assert len(monthly_rev.json()) > 0, "Expected monthly revenue records"

        # 7. Test Security: Customer Forbidden from Analytics
        print("\n--- 8. Testing Customer Access to /analytics (Should be 403 Forbidden) ---")
        cust_analytics = requests.get(
            f"{base_url}/analytics/overview",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        print("Customer status on /analytics:", cust_analytics.status_code, cust_analytics.json())
        assert cust_analytics.status_code == 403, "Security check failed: customer was allowed into analytics"

        print("\n=====================================================")
        print("🎉 ALL PART 6 & 7 INTEGRATION TESTS PASSED!")
        print("=====================================================\n")
    except Exception as err:
        print(f"\n❌ Test failure: {err}")
        server.should_exit = True
        sys.exit(1)
    finally:
        cache.disconnect()
        server.should_exit = True


if __name__ == "__main__":
    run_part6_and_7_tests()
