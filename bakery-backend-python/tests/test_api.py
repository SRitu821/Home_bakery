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


def get_free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def run_tests():
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

    print(f"Test server running on port {port}\n")

    try:
        timestamp = int(time.time() * 1000)
        admin_email = f"admin_{timestamp}@bakery.com"
        customer_email = f"customer_{timestamp}@bakery.com"

        # 1. Health check
        print("--- 1. Testing GET /health ---")
        health = requests.get(f"{base_url}/health")
        print("Health status:", health.status_code, health.json())
        assert health.status_code == 200, "Health check failed"

        # 2. Register Admin
        print("\n--- 2. Testing POST /register (ADMIN) ---")
        reg_admin = requests.post(
            f"{base_url}/register",
            json={
                "name": "Admin Baker",
                "email": admin_email,
                "password": "adminpassword123",
                "role": "ADMIN",
            },
        )
        print("Register admin status:", reg_admin.status_code, reg_admin.json().get("user"))
        assert reg_admin.status_code == 201, "Admin registration failed"
        admin_token = reg_admin.json()["token"]

        # 3. Register Customer
        print("\n--- 3. Testing POST /register (CUSTOMER) ---")
        reg_cust = requests.post(
            f"{base_url}/register",
            json={
                "name": "Sweet Tooth",
                "email": customer_email,
                "password": "customerpass123",
            },
        )
        print("Register customer status:", reg_cust.status_code, reg_cust.json().get("user"))
        assert reg_cust.status_code == 201, "Customer registration failed"
        customer_token = reg_cust.json()["token"]

        # 4. Test Login
        print("\n--- 4. Testing POST /login ---")
        login_res = requests.post(
            f"{base_url}/login",
            json={"email": customer_email, "password": "customerpass123"},
        )
        print("Login status:", login_res.status_code, "User:", login_res.json().get("user"))
        assert login_res.status_code == 200 and login_res.json().get("token"), "Login failed"

        # 5. Test Categories
        print("\n--- 5. Testing GET /categories ---")
        cats = requests.get(f"{base_url}/categories")
        print("Categories count:", len(cats.json()), cats.json()[:2])
        assert len(cats.json()) > 0, "No categories found"
        category_id = cats.json()[0]["id"]

        # 6. Admin creates product
        print("\n--- 6. Testing POST /products (as Admin) ---")
        new_prod = requests.post(
            f"{base_url}/products",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": f"Black Forest Cake {timestamp}",
                "category_id": category_id,
                "price": 550,
                "stock": 10,
                "description": "Delicious chocolate cherry cake",
            },
        )
        print("Create product status:", new_prod.status_code, new_prod.json())
        assert new_prod.status_code == 201, "Admin create product failed"
        product_id = new_prod.json()["id"]

        # 7. Customer tries to create product (should fail 403)
        print("\n--- 7. Testing POST /products (as Customer - should be 403) ---")
        unauth_prod = requests.post(
            f"{base_url}/products",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "name": "Unauthorized Cake",
                "category_id": category_id,
                "price": 100,
                "stock": 5,
            },
        )
        print("Unauthorized product creation status:", unauth_prod.status_code, unauth_prod.json())
        assert unauth_prod.status_code == 403, "Security check failed: Customer was able to create product"

        # 8. Search & Filter products
        print("\n--- 8. Testing GET /products?search=cherry ---")
        search_res = requests.get(f"{base_url}/products?search=cherry")
        print("Search results count:", len(search_res.json()))
        assert len(search_res.json()) > 0, "Search failed to find product"

        # 9. Add to Cart (Customer)
        print("\n--- 9. Testing POST /cart (Customer adds product) ---")
        add_cart = requests.post(
            f"{base_url}/cart",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product_id, "quantity": 2},
        )
        print("Add to cart status:", add_cart.status_code, add_cart.json())
        assert add_cart.status_code == 201, "Add to cart failed"

        # 10. View Cart
        print("\n--- 10. Testing GET /cart ---")
        view_cart = requests.get(
            f"{base_url}/cart",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        cart_data = view_cart.json()
        print("View cart status:", view_cart.status_code, "Total:", cart_data.get("total_amount"), "Items:", len(cart_data.get("items", [])))
        assert len(cart_data.get("items", [])) == 1, "Expected 1 item in cart"
        assert cart_data.get("total_amount") == 1100, f"Expected total 1100, got {cart_data.get('total_amount')}"

        # 11. Place Order (Transaction)
        print("\n--- 11. Testing POST /orders (Checkout Transaction) ---")
        place_order = requests.post(
            f"{base_url}/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={},
        )
        print("Place order status:", place_order.status_code, "Order:", place_order.json().get("order"))
        assert place_order.status_code == 201, "Order placement transaction failed"
        order_id = place_order.json()["order"]["id"]

        # 12. Verify Cart is Empty after order
        print("\n--- 12. Testing GET /cart after order (should be empty) ---")
        empty_cart = requests.get(
            f"{base_url}/cart",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        print("Cart items count:", len(empty_cart.json().get("items", [])))
        assert len(empty_cart.json().get("items", [])) == 0, "Cart was not emptied after order placement"

        # 13. Verify Stock was reduced (from 10 to 8)
        print("\n--- 13. Testing GET /products/:id (Stock deduction check) ---")
        check_prod = requests.get(f"{base_url}/products/{product_id}")
        prod_stock = check_prod.json().get("stock")
        print("Product current stock:", prod_stock)
        assert prod_stock == 8, f"Stock deduction failed: expected 8, got {prod_stock}"

        # 14. Admin updates order status
        print("\n--- 14. Testing PUT /orders/:id/status (as Admin) ---")
        upd_status = requests.put(
            f"{base_url}/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "BAKING"},
        )
        new_status = upd_status.json().get("order", {}).get("status")
        print("Update status result:", upd_status.status_code, new_status)
        assert new_status == "BAKING", "Order status update failed"

        # 15. Customer cannot update order status
        print("\n--- 15. Testing PUT /orders/:id/status (as Customer - should be 403) ---")
        cust_upd = requests.put(
            f"{base_url}/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"status": "DELIVERED"},
        )
        print("Customer update status check:", cust_upd.status_code, cust_upd.json())
        assert cust_upd.status_code == 403, "Security check failed: Customer updated order status"

        print("\n===========================================")
        print("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("===========================================\n")
    except Exception as err:
        print(f"\n❌ Test failure: {err}")
        server.should_exit = True
        sys.exit(1)
    finally:
        server.should_exit = True


if __name__ == "__main__":
    run_tests()
