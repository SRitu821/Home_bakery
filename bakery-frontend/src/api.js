// API client for Home Bakery backend
const TOKEN_KEY = 'home_bakery_token';
const USER_KEY = 'home_bakery_user';

export const api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(path, {
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errorMsg =
          (data && (data.error || data.detail || (data.details && data.details[0]?.msg))) ||
          `Request failed with status ${res.status}`;
        const err = new Error(errorMsg);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      // Re-throw with descriptive context
      throw err;
    }
  },

  // Health
  checkHealth() {
    return this.request('/health');
  },

  // Auth
  register(name, email, password, role = 'CUSTOMER') {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Categories
  getCategories() {
    return this.request('/categories');
  },

  createCategory(name) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Products
  getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) {
      params.append('min_price', filters.minPrice);
      params.append('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
      params.append('max_price', filters.maxPrice);
      params.append('maxPrice', filters.maxPrice);
    }
    if (filters.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/products${query}`);
  },

  getPopularProducts() {
    return this.request('/products/popular');
  },

  getProductById(id) {
    return this.request(`/products/${id}`);
  },

  createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Cart
  getCart() {
    return this.request('/cart');
  },

  addToCart(productId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  updateCartItem(itemId, quantity) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  removeCartItem(itemId) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Orders
  placeOrder() {
    return this.request('/orders', {
      method: 'POST',
    });
  },

  getOrders(targetUserId = null) {
    const query = targetUserId ? `?user_id=${targetUserId}` : '';
    return this.request(`/orders${query}`);
  },

  getOrderById(id) {
    return this.request(`/orders/${id}`);
  },

  updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Analytics
  getOverview() {
    return this.request('/analytics/overview');
  },

  getTopSelling() {
    return this.request('/analytics/top-selling');
  },

  getMonthlyRevenue() {
    return this.request('/analytics/monthly-revenue');
  },
};
