import { api } from './api.js';
import { isLoggedIn, openAuthModal } from './auth.js';
import { showToast } from './toast.js';
import { enrichProduct, PRODUCT_REGISTRY, inferCategory } from './catalog_data.js';

let ordersList = [];

export function initOrders() {
  const ordersNavBtn = document.getElementById('orders-nav-btn');
  const ordersModal = document.getElementById('orders-modal');
  const ordersModalClose = document.getElementById('orders-modal-close');

  if (ordersNavBtn) {
    ordersNavBtn.addEventListener('click', () => {
      if (!isLoggedIn()) {
        showToast('Please sign in to view your orders', 'warning');
        openAuthModal('login');
        return;
      }
      openOrdersModal();
    });
  }

  if (ordersModalClose) {
    ordersModalClose.addEventListener('click', closeOrdersModal);
  }

  if (ordersModal) {
    ordersModal.addEventListener('click', (e) => {
      if (e.target === ordersModal) closeOrdersModal();
    });
  }
}

export async function openOrdersModal() {
  const modal = document.getElementById('orders-modal');
  if (!modal) return;
  modal.classList.add('open');
  await loadOrders();
}

export function closeOrdersModal() {
  const modal = document.getElementById('orders-modal');
  if (modal) modal.classList.remove('open');
}

export async function loadOrders() {
  const container = document.getElementById('orders-list-container');
  const emptyEl = document.getElementById('orders-empty-state');
  if (!container) return;

  try {
    container.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading your orders...</div>';
    ordersList = await api.getOrders();

    if (!ordersList || ordersList.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    container.innerHTML = ordersList
      .map((order) => {
        const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const statusClass = `status-${(order.status || 'PENDING').toLowerCase()}`;

        return `
        <div class="order-card" data-order-id="${order.id}">
          <div class="order-card-header">
            <div>
              <span class="order-id">Order #${order.id}</span>
              <span class="order-date">${dateStr}</span>
            </div>
            <span class="status-pill ${statusClass}">
              ${getStatusIcon(order.status)} ${order.status}
            </span>
          </div>

          <div class="order-timeline">
            ${renderTimelineSteps(order.status)}
          </div>

          <div class="order-card-footer">
            <span class="order-total-label">Total: <strong>$${parseFloat(order.total_amount).toFixed(2)}</strong></span>
            <button class="btn btn-outline btn-sm view-order-details-btn" data-id="${order.id}">
              View Details
            </button>
          </div>
          <div class="order-details-expanded hidden" id="order-details-${order.id}"></div>
        </div>
      `;
      })
      .join('');

    // Attach event listeners to "View Details"
    container.querySelectorAll('.view-order-details-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        toggleOrderDetails(orderId, btn);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="error-state">Failed to load orders: ${escapeHtml(err.message)}</div>`;
  }
}

async function toggleOrderDetails(orderId, btn) {
  const detailsContainer = document.getElementById(`order-details-${orderId}`);
  if (!detailsContainer) return;

  if (!detailsContainer.classList.contains('hidden')) {
    detailsContainer.classList.add('hidden');
    btn.textContent = 'View Details';
    return;
  }

  try {
    btn.textContent = 'Loading...';
    const data = await api.getOrderById(orderId);
    const items = data.items || [];

    detailsContainer.innerHTML = `
      <div class="order-items-table">
        <h5>Ordered Items:</h5>
        <ul>
          ${items
            .map((item) => {
              const enriched = PRODUCT_REGISTRY.get(item.product_id) || enrichProduct({
                id: item.product_id,
                name: item.name,
                category: inferCategory(item.product_id),
              });
              return `
            <li>
              <span class="item-name">${escapeHtml(enriched.name)} &times; ${item.quantity}</span>
              <span class="item-subtotal">$${parseFloat(item.subtotal || item.price * item.quantity).toFixed(2)}</span>
            </li>
          `;
            })
            .join('')}
        </ul>
      </div>
    `;

    detailsContainer.classList.remove('hidden');
    btn.textContent = 'Hide Details';
  } catch (err) {
    showToast(err.message || 'Failed to load order details', 'error');
    btn.textContent = 'View Details';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'PENDING':
      return '⏳';
    case 'CONFIRMED':
      return '✅';
    case 'BAKING':
      return '👨‍🍳';
    case 'DELIVERED':
      return '🛵';
    case 'CANCELLED':
      return '❌';
    default:
      return '📦';
  }
}

function renderTimelineSteps(currentStatus) {
  const steps = ['PENDING', 'CONFIRMED', 'BAKING', 'DELIVERED'];
  if (currentStatus === 'CANCELLED') {
    return `<div class="timeline-cancelled">This order was cancelled.</div>`;
  }

  const currentIndex = steps.indexOf(currentStatus);

  return `
    <div class="stepper-bar">
      ${steps
        .map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return `
          <div class="stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
            <div class="step-dot"></div>
            <span class="step-label">${step}</span>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
