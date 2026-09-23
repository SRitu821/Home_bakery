import { api } from './api.js';
import { initAuth, onAuthStateChanged, openAuthModal, logout } from './auth.js';
import { initCart, addToCart, refreshCart, onOrderPlaced } from './cart.js';
import { initOrders, loadOrders } from './orders.js';
import { initAdmin } from './admin.js';
import { showToast } from './toast.js';
import { curateCatalog, enrichProduct, getProductImage, MAX_FRONTEND_PRODUCTS } from './catalog_data.js';

let currentCategory = 'all';
let currentSearch = '';
let currentMaxPrice = 60;
let isShowingPopular = false;
let allLoadedProducts = [];
let filteredProducts = [];
let currentPage = 1;
const PAGE_SIZE = 24;

// Fallback demo catalog if backend is fresh or empty
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
        currentPage = 1;
        applyFiltersAndRender();
      }, 250);
    });
  }

  // Price range slider
  const priceSlider = document.getElementById('price-slider');
  const priceDisplay = document.getElementById('price-range-val');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      currentMaxPrice = e.target.value;
      priceDisplay.textContent = `$${currentMaxPrice}`;
      currentPage = 1;
      applyFiltersAndRender();
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
      currentPage = 1;
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
        currentPage = 1;
        applyFiltersAndRender();
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
  if (!grid) return;

  grid.innerHTML = `
    <div class="grid-loader">
      <span class="spinner"></span>
      <p>Baking fresh artisanal selections...</p>
    </div>
  `;

  try {
    let rawList = [];

    if (isShowingPopular) {
      const popRes = await api.getPopularProducts();
      rawList = popRes.data || [];
    } else {
      rawList = await api.getProducts();
    }

    if (!rawList || rawList.length === 0) {
      rawList = DEMO_FALLBACK_PRODUCTS;
    }

    // Curate and bound the catalog strictly to 200-250 items (specifically 225 items)
    allLoadedProducts = curateCatalog(rawList, MAX_FRONTEND_PRODUCTS);
    applyFiltersAndRender();
  } catch (err) {
    console.warn('API error, falling back to local demo catalog', err);
    allLoadedProducts = curateCatalog(DEMO_FALLBACK_PRODUCTS, MAX_FRONTEND_PRODUCTS);
    applyFiltersAndRender();
  }
}

function applyFiltersAndRender() {
  let list = [...allLoadedProducts];

  // Category filter
  if (currentCategory && currentCategory !== 'all' && currentCategory !== 'popular') {
    list = list.filter((p) => (p.category || '').toLowerCase() === currentCategory.toLowerCase());
  }

  // Live search keyword filter
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Max price slider filter
  if (currentMaxPrice) {
    list = list.filter((p) => p.price <= parseFloat(currentMaxPrice));
  }

  filteredProducts = list;

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, totalItems);
  const pageItems = filteredProducts.slice(startIdx, endIdx);

  // Update summary badge & pagination hint
  updateCatalogSummary(totalItems, startIdx, endIdx, currentPage, totalPages);

  // Render cards for the current page
  renderProductCards(pageItems);

  // Render pagination buttons
  renderPagination(totalPages);
}

function updateCatalogSummary(totalItems, startIdx, endIdx, page, totalPages) {
  const badge = document.getElementById('catalog-count-badge');
  const hint = document.getElementById('catalog-page-hint');

  const catLabel =
    currentCategory === 'all'
      ? 'Artisanal Bakes'
      : currentCategory === 'popular'
      ? 'Best Sellers'
      : `${currentCategory}`;

  if (badge) {
    badge.textContent = `🥐 Showing ${totalItems} ${catLabel}`;
  }

  if (hint) {
    if (totalItems === 0) {
      hint.textContent = 'No matching items';
    } else {
      hint.textContent = `Items ${startIdx + 1}–${endIdx} (Page ${page} of ${totalPages})`;
    }
  }
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="pagination-btn" id="pg-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
      &laquo; Prev
    </button>
  `;

  // Smart page numbers windowing
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  pages.forEach((p) => {
    if (p === '...') {
      html += `<span class="pagination-ellipsis">&hellip;</span>`;
    } else {
      html += `
        <button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}" aria-label="Go to page ${p}">
          ${p}
        </button>
      `;
    }
  });

  html += `
    <button class="pagination-btn" id="pg-next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
      Next &raquo;
    </button>
  `;

  container.innerHTML = html;

  // Event handlers
  const prevBtn = document.getElementById('pg-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
        scrollToCatalogTop();
      }
    });
  }

  const nextBtn = document.getElementById('pg-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndRender();
        scrollToCatalogTop();
      }
    });
  }

  container.querySelectorAll('.pagination-btn[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.getAttribute('data-page'), 10);
      if (p && p !== currentPage) {
        currentPage = p;
        applyFiltersAndRender();
        scrollToCatalogTop();
      }
    });
  });
}

function scrollToCatalogTop() {
  const section = document.getElementById('catalog-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      const imageUrl = product.image_url || getProductImage(product);

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
