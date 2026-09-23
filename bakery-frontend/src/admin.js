import { api } from './api.js';
import { isAdmin } from './auth.js';
import { showToast } from './toast.js';
import { curateCatalog, MAX_FRONTEND_PRODUCTS, formatCurrency } from './catalog_data.js';

let allCategories = [];
let allAdminProducts = [];

export function initAdmin(onCatalogMutated) {
  const adminNavBtn = document.getElementById('admin-nav-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminModalClose = document.getElementById('admin-modal-close');

  if (adminNavBtn) {
    adminNavBtn.addEventListener('click', () => {
      if (!isAdmin()) {
        showToast('Admin privileges required', 'error');
        return;
      }
      openAdminModal(onCatalogMutated);
    });
  }

  if (adminModalClose) {
    adminModalClose.addEventListener('click', closeAdminModal);
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  // Setup Admin Tabs
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.admin-tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === targetId);
      });

      if (targetId === 'admin-tab-analytics') loadAnalytics();
      if (targetId === 'admin-tab-products') loadAdminProducts(onCatalogMutated);
      if (targetId === 'admin-tab-orders') loadAdminOrders();
    });
  });

  // Setup Add Product Form
  const addProductForm = document.getElementById('admin-add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prod-name').value.trim();
      const category_id = parseInt(document.getElementById('prod-category').value, 10);
      const price = parseFloat(document.getElementById('prod-price').value);
      const stock = parseInt(document.getElementById('prod-stock').value, 10);
      const description = document.getElementById('prod-desc').value.trim();

      try {
        await api.createProduct({ name, category_id, price, stock, description });
        showToast(`Product "${name}" added to catalog! 🥐`, 'success');
        addProductForm.reset();
        await loadAdminProducts(onCatalogMutated);
        if (onCatalogMutated) onCatalogMutated();
      } catch (err) {
        showToast(err.message || 'Failed to create product', 'error');
      }
    });
  }

  // Setup Add Category Form
  const addCatForm = document.getElementById('admin-add-category-form');
  if (addCatForm) {
    addCatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const catName = document.getElementById('new-cat-name').value.trim();
      if (!catName) return;

      try {
        await api.createCategory(catName);
        showToast(`Category "${catName}" created!`, 'success');
        addCatForm.reset();
        await refreshCategorySelect();
        if (onCatalogMutated) onCatalogMutated();
      } catch (err) {
        showToast(err.message || 'Failed to create category', 'error');
      }
    });
  }
}

export async function openAdminModal(onCatalogMutated) {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  modal.classList.add('open');

  await refreshCategorySelect();
  // Default to analytics tab
  const defaultTab = document.querySelector('.admin-tab-btn[data-tab="admin-tab-analytics"]');
  if (defaultTab) defaultTab.click();
}

export function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.remove('open');
}

async function refreshCategorySelect() {
  const select = document.getElementById('prod-category');
  if (!select) return;

  try {
    allCategories = await api.getCategories();
    select.innerHTML = allCategories
      .map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`)
      .join('');
  } catch (err) {
    console.warn('Could not load categories for admin form', err);
  }
}

async function loadAnalytics() {
  const kpiRev = document.getElementById('kpi-revenue');
  const kpiOrders = document.getElementById('kpi-orders');
  const kpiCustomers = document.getElementById('kpi-customers');
  const kpiLowStock = document.getElementById('kpi-low-stock');
  const topSellingList = document.getElementById('admin-top-selling-table');
  const monthlyRevList = document.getElementById('admin-monthly-revenue-table');

  try {
    const overview = await api.getOverview();
    if (kpiRev) kpiRev.textContent = formatCurrency(overview.total_revenue || 0);
    if (kpiOrders) kpiOrders.textContent = overview.completed_orders || 0;
    if (kpiCustomers) kpiCustomers.textContent = overview.total_customers || 0;
    if (kpiLowStock) kpiLowStock.textContent = overview.low_stock_products || 0;

    // Top Selling
    const topSelling = await api.getTopSelling();
    if (topSellingList) {
      if (!topSelling || topSelling.length === 0) {
        topSellingList.innerHTML = '<tr><td colspan="4" class="text-muted">No sales data yet.</td></tr>';
      } else {
        topSellingList.innerHTML = topSelling
          .map(
            (p, idx) => `
          <tr>
            <td><strong>#${idx + 1}</strong> ${escapeHtml(p.name)}</td>
            <td><span class="badge badge-subtle">${escapeHtml(p.category)}</span></td>
            <td>${p.units_sold} units</td>
            <td><strong>${formatCurrency(p.total_revenue)}</strong></td>
          </tr>
        `
          )
          .join('');
      }
    }

    // Monthly Revenue
    const monthlyRev = await api.getMonthlyRevenue();
    if (monthlyRevList) {
      if (!monthlyRev || monthlyRev.length === 0) {
        monthlyRevList.innerHTML = '<tr><td colspan="3" class="text-muted">No monthly records yet.</td></tr>';
      } else {
        monthlyRevList.innerHTML = monthlyRev
          .map(
            (m) => `
          <tr>
            <td><strong>${m.month}</strong></td>
            <td>${m.total_orders} orders</td>
            <td><strong>${formatCurrency(m.gross_revenue)}</strong></td>
          </tr>
        `
          )
          .join('');
      }
    }
  } catch (err) {
    showToast(`Analytics load error: ${err.message}`, 'error');
  }
}

async function loadAdminProducts(onCatalogMutated) {
  const container = document.getElementById('admin-products-table-body');
  if (!container) return;

  try {
    container.innerHTML = '<tr><td colspan="6">Loading catalog...</td></tr>';
    const rawProducts = await api.getProducts();
    allAdminProducts = curateCatalog(rawProducts, MAX_FRONTEND_PRODUCTS);

    if (!allAdminProducts || allAdminProducts.length === 0) {
      container.innerHTML = '<tr><td colspan="6">No products found.</td></tr>';
      return;
    }

    container.innerHTML = allAdminProducts
      .map(
        (p) => `
      <tr data-prod-id="${p.id}">
        <td><strong>#${p.id}</strong></td>
        <td>
          <div class="prod-cell-name">${escapeHtml(p.name)}</div>
          <small class="text-muted">${escapeHtml(p.description || '')}</small>
        </td>
        <td><span class="badge badge-subtle">${escapeHtml(p.category || '')}</span></td>
        <td>${formatCurrency(p.price)}</td>
        <td>
          <span class="stock-pill ${p.stock < 5 ? 'stock-low' : 'stock-ok'}">
            ${p.stock} in stock
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm admin-del-prod-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">
            Delete
          </button>
        </td>
      </tr>
    `
      )
      .join('');

    container.querySelectorAll('.admin-del-prod-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
          await api.deleteProduct(id);
          showToast(`Product "${name}" deleted`, 'info');
          await loadAdminProducts(onCatalogMutated);
          if (onCatalogMutated) onCatalogMutated();
        } catch (err) {
          showToast(err.message || 'Failed to delete product', 'error');
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<tr><td colspan="6">Error loading products: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-table-body');
  if (!container) return;

  try {
    container.innerHTML = '<tr><td colspan="6">Loading all orders...</td></tr>';
    const orders = await api.getOrders();

    if (!orders || orders.length === 0) {
      container.innerHTML = '<tr><td colspan="6">No orders placed yet.</td></tr>';
      return;
    }

    const statuses = ['PENDING', 'CONFIRMED', 'BAKING', 'DELIVERED', 'CANCELLED'];

    container.innerHTML = orders
      .map((o) => {
        const dateStr = new Date(o.created_at).toLocaleString();
        const optionsHtml = statuses
          .map(
            (s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`
          )
          .join('');

        return `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>User #${o.user_id}</td>
          <td>${formatCurrency(o.total_amount)}</td>
          <td>
            <select class="admin-status-select" data-order-id="${o.id}">
              ${optionsHtml}
            </select>
          </td>
          <td><small class="text-muted">${dateStr}</small></td>
        </tr>
      `;
      })
      .join('');

    container.querySelectorAll('.admin-status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const orderId = select.getAttribute('data-order-id');
        const newStatus = select.value;

        try {
          await api.updateOrderStatus(orderId, newStatus);
          showToast(`Order #${orderId} status changed to ${newStatus}`, 'success');
        } catch (err) {
          showToast(err.message || 'Failed to update order status', 'error');
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<tr><td colspan="6">Error loading orders: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
