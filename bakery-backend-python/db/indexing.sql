-- Performance Indexes for Home Bakery Backend

-- 1. Foreign key index on products(category_id)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- 2. Index on products(price)
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- 3. Foreign key index on orders(user_id)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 4. Index on orders(status)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 5. Foreign key index on cart_items(cart_id)
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- 6. Foreign key index on order_items(order_id)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. Foreign key index on order_items(product_id)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
