import { api } from './api.js';
import { initAuth, onAuthStateChanged, openAuthModal, logout } from './auth.js';
import { initCart, addToCart, refreshCart, onOrderPlaced } from './cart.js';
import { initOrders, loadOrders } from './orders.js';
import { initAdmin } from './admin.js';
import { showToast } from './toast.js';

let currentCategory = 'all';
let currentSearch = '';
let currentMaxPrice = 50;
let isShowingPopular = false;
let allLoadedProducts = [];

// Curated image mapping for bakery items
const PRODUCT_IMAGE_MAP = {
  croissant: '/assets/croissant.jpg',
  pastry: '/assets/croissant.jpg',
  cake: '/assets/chocolate_cake.jpg',
  chocolate: '/assets/chocolate_cake.jpg',
  bread: '/assets/sourdough_bread.jpg',
  sourdough: '/assets/sourdough_bread.jpg',
  cookie: '/assets/cookies.jpg',
  cookies: '/assets/cookies.jpg',
};

function getProductImage(product) {
  const nameLower = (product.name || '').toLowerCase();
  const catLower = (product.category || '').toLowerCase();

  for (const [keyword, imgUrl] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (nameLower.includes(keyword) || catLower.includes(keyword)) {
      return imgUrl;
    }
  }

  // Category fallback
  if (catLower.includes('cake')) return '/assets/chocolate_cake.jpg';
  if (catLower.includes('bread')) return '/assets/sourdough_bread.jpg';
  if (catLower.includes('cookie')) return '/assets/cookies.jpg';

  return '/assets/croissant.jpg';
}

// Fallback demo catalog if the backend database is fresh or empty
const DEMO_FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: 'Artisan Butter Croissant',
    category: 'Breads',
    price: 3.5,
    stock: 24,
    description: 'Freshly baked French flaky golden butter croissant with delicate crisp layers.',
  },
  {
    id: 2,
    name: 'Decadent Dark Chocolate Cake',
    category: 'Cakes',
    price: 28.0,
    stock: 8,
    description: 'Multi-layer Belgian dark chocolate sponge layered with velvety ganache and fresh raspberries.',
  },
  {
    id: 3,
    name: 'Rustic Sourdough Boule',
    category: 'Breads',
    price: 6.5,
    stock: 15,
    description: 'Naturally fermented 36-hour slow-rise artisan sourdough with a blistered crisp ear crust.',
  },
  {
    id: 4,
    name: 'Sea Salt Chocolate Chunk Cookies',
    category: 'Cookies',
    price: 4.25,
    stock: 30,
    description: 'Soft & chewy gourmet cookies packed with melted chocolate pools and Maldon sea salt flakes.',
  },
  {
    id: 5,
    name: 'Berry Chantilly Cream Cake',
    category: 'Cakes',
    price: 32.0,
    stock: 6,
    description: 'Light vanilla sponge cake layered with delicate almond mascarpone chantilly and wild berries.',
  },
  {
    id: 6,
    name: 'Golden Saffron Brioche',
    category: 'Breads',
    price: 5.75,
    stock: 12,
    description: 'Pillow-soft, buttery enriched brioche loaf infused with aromatic saffron strands.',
  },
];

document.addEventListener('DOMContentLoaded', async () => {
  setupUIEventListeners();
  initAuth();
  initCart();
  initOrders();
  initAdmin(loadProducts);

  // Auth State Listener
  onAuthStateChanged((user) => {
    updateAuthUI(user);
    refreshCart();
  });

  // When order is placed, reload products (stock changed) and orders
  onOrderPlaced(() => {
    loadProducts();
    loadOrders();
  });

  // Check backend health & load initial data
  await checkBackendStatus();
  await loadCategories();
  await loadProducts();
});

async function checkBackendStatus() {
  const statusBadge = document.getElementById('backend-status-indicator');
  try {
    const res = await api.checkHealth();
    if (statusBadge) {
      statusBadge.textContent = 'API Connected';
      statusBadge.className = 'status-tag status-online';
      statusBadge.title = 'FastAPI Backend is operational';
    }
  } catch (err) {
    if (statusBadge) {
      statusBadge.textContent = 'Backend Offline (Demo Fallback)';
      statusBadge.className = 'status-tag status-offline';
      statusBadge.title = 'Start backend on http://localhost:8000 for full database persistence';
    }
  }
}

function updateAuthUI(user) {
  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('user-profile-menu');
  const userNameEl = document.getElementById('nav-user-name');
  const userRoleEl = document.getElementById('nav-user-role');
  const adminNavBtn = document.getElementById('admin-nav-btn');

  if (user) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) {
      userRoleEl.textContent = user.role;
      userRoleEl.className = `role-badge role-${user.role.toLowerCase()}`;
    }
    if (adminNavBtn) {
      adminNavBtn.classList.toggle('hidden', user.role !== 'ADMIN');
    }
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (adminNavBtn) adminNavBtn.classList.add('hidden');
  }
}

function setupUIEventListeners() {
  // Login button in header
  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => openAuthModal('login'));
  }

  // Logout button
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadProducts();
      }, 300);
    });
  }

  // Price range slider
  const priceSlider = document.getElementById('price-slider');
  const priceDisplay = document.getElementById('price-range-val');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      currentMaxPrice = e.target.value;
      priceDisplay.textContent = `$${currentMaxPrice}`;
    });
    priceSlider.addEventListener('change', () => {
      loadProducts();
    });
  }

  // Popular / Best Sellers tab
  const popularTabBtn = document.getElementById('tab-popular');
  if (popularTabBtn) {
    popularTabBtn.addEventListener('click', () => {
      isShowingPopular = !isShowingPopular;
      popularTabBtn.classList.toggle('active', isShowingPopular);
      document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
      if (isShowingPopular) {
        currentCategory = 'popular';
      } else {
        currentCategory = 'all';
        document.querySelector('.cat-pill[data-category="all"]')?.classList.add('active');
      }
      loadProducts();
    });
  }

  // Hero CTA button: jump to catalog
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', () => {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

async function loadCategories() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  try {
    const categories = await api.getCategories();
    const categoriesToRender =
      categories && categories.length > 0
        ? categories
        : [{ id: 1, name: 'Cakes' }, { id: 2, name: 'Cookies' }, { id: 3, name: 'Breads' }];

    const pillsHtml = `
      <button class="cat-pill active" data-category="all">🥐 All Bakes</button>
      ${categoriesToRender
        .map(
          (c) =>
            `<button class="cat-pill" data-category="${escapeHtml(c.name)}">${getCategoryEmoji(c.name)} ${escapeHtml(c.name)}</button>`
        )
        .join('')}
    `;

    container.innerHTML = pillsHtml;

    container.querySelectorAll('.cat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        // Deactivate popular tab if category chosen
        const popularTabBtn = document.getElementById('tab-popular');
        if (popularTabBtn) popularTabBtn.classList.remove('active');
        isShowingPopular = false;

        currentCategory = pill.getAttribute('data-category');
        loadProducts();
      });
    });
  } catch (err) {
    console.warn('Using default category pills', err);
  }
}

function getCategoryEmoji(catName) {
  const name = catName.toLowerCase();
  if (name.includes('cake')) return '🍰';
  if (name.includes('cookie')) return '🍪';
  if (name.includes('bread')) return '🥖';
  return '🥨';
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('products-empty-state');
  if (!grid) return;

  grid.innerHTML = `
    <div class="grid-loader">
      <span class="spinner"></span>
      <p>Baking fresh selections...</p>
    </div>
  `;

  try {
    let products = [];

    if (isShowingPopular) {
      const popRes = await api.getPopularProducts();
      products = popRes.data || [];
    } else {
      const filters = {};
      if (currentCategory && currentCategory !== 'all') {
        filters.category = currentCategory;
      }
      if (currentSearch) {
        filters.search = currentSearch;
      }
      if (currentMaxPrice) {
        filters.maxPrice = currentMaxPrice;
      }

      products = await api.getProducts(filters);
    }

    // Fallback if empty and no specific query was made
    if ((!products || products.length === 0) && !currentSearch && currentCategory === 'all') {
      products = DEMO_FALLBACK_PRODUCTS;
    }

    allLoadedProducts = products;
    renderProductCards(products);
  } catch (err) {
    console.warn('API error, falling back to local demo catalog', err);
    // Filter demo catalog locally so user can still interact!
    let filtered = DEMO_FALLBACK_PRODUCTS;
    if (currentCategory && currentCategory !== 'all' && currentCategory !== 'popular') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === currentCategory.toLowerCase());
    }
    if (currentSearch) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(currentSearch.toLowerCase()))
      );
    }
    filtered = filtered.filter((p) => p.price <= parseFloat(currentMaxPrice));

    allLoadedProducts = filtered;
    renderProductCards(filtered);
  }
}

function renderProductCards(products) {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('products-empty-state');
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = products
    .map((product) => {
      const isOutOfStock = product.stock <= 0;
      const imageUrl = getProductImage(product);

      return `
      <article class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${product.id}">
        <div class="product-img-wrapper">
          <img src="${imageUrl}" alt="${escapeHtml(product.name)}" class="product-img" loading="lazy" />
          <span class="product-category-tag">${escapeHtml(product.category || 'Bakery')}</span>
          ${isOutOfStock ? '<span class="badge-sold-out">Sold Out</span>' : ''}
          ${product.units_sold ? `<span class="badge-bestseller">🔥 ${product.units_sold} Sold</span>` : ''}
        </div>
        <div class="product-body">
          <div class="product-header">
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
          </div>
          <p class="product-desc">${escapeHtml(product.description || 'Artisanal bake prepared with premium organic ingredients.')}</p>
          
          <div class="product-footer">
            <span class="stock-info ${product.stock < 5 ? 'stock-low-warning' : ''}">
              ${product.stock > 0 ? `${product.stock} available` : 'Restocking soon'}
            </span>

            <div class="card-action-group">
              <div class="quantity-input-group">
                <input type="number" class="qty-field" id="qty-input-${product.id}" value="1" min="1" max="${product.stock}" ${isOutOfStock ? 'disabled' : ''} />
              </div>
              <button 
                class="btn btn-primary add-to-cart-btn" 
                data-id="${product.id}" 
                ${isOutOfStock ? 'disabled' : ''}
              >
                ${isOutOfStock ? 'Unavailable' : 'Add to Cart 🛒'}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
    })
    .join('');

  // Attach Add to Cart event listeners
  grid.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prodId = parseInt(btn.getAttribute('data-id'), 10);
      const product = allLoadedProducts.find((p) => p.id === prodId);
      const qtyInput = document.getElementById(`qty-input-${prodId}`);
      const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

      if (product) {
        addToCart(product, quantity);
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
