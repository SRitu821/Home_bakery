import { api } from './api.js';
import { isLoggedIn, openAuthModal } from './auth.js';
import { showToast } from './toast.js';

let cartItems = [];
let cartTotal = 0;
let isCartOpen = false;

// Custom event listener for when orders are placed
const orderPlacedCallbacks = [];
export function onOrderPlaced(cb) {
  orderPlacedCallbacks.push(cb);
}

export function initCart() {
  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const cartDrawerClose = document.getElementById('cart-drawer-close');
  const cartBackdrop = document.getElementById('cart-drawer-backdrop');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', toggleCartDrawer);
  }

  if (cartDrawerClose) {
    cartDrawerClose.addEventListener('click', closeCartDrawer);
  }

  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', closeCartDrawer);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // Initial load
  refreshCart();
}

export async function refreshCart() {
  if (!isLoggedIn()) {
    cartItems = [];
    cartTotal = 0;
    renderCart();
    return;
  }

  try {
    const data = await api.getCart();
    cartItems = data.items || [];
    cartTotal = parseFloat(data.total_amount) || 0;
    renderCart();
  } catch (err) {
    // If not authenticated or error, reset
    cartItems = [];
    cartTotal = 0;
    renderCart();
  }
}

export async function addToCart(product, quantity = 1) {
  if (!isLoggedIn()) {
    showToast('Please sign in or register to add items to your cart 🥐', 'warning');
    openAuthModal('login');
    return;
  }

  try {
    await api.addToCart(product.id, quantity);
    showToast(`Added ${quantity}x "${product.name}" to cart! 🛒`, 'success');
    await refreshCart();
    openCartDrawer();
  } catch (err) {
    showToast(err.message || 'Could not add item to cart', 'error');
  }
}

export async function updateItemQuantity(itemId, quantity) {
  if (quantity <= 0) {
    await removeCartItem(itemId);
    return;
  }

  try {
    await api.updateCartItem(itemId, quantity);
    await refreshCart();
  } catch (err) {
    showToast(err.message || 'Could not update quantity', 'error');
  }
}

export async function removeCartItem(itemId) {
  try {
    await api.removeCartItem(itemId);
    showToast('Item removed from cart', 'info');
    await refreshCart();
  } catch (err) {
    showToast(err.message || 'Could not remove item', 'error');
  }
}

async function handleCheckout() {
  if (!isLoggedIn()) {
    showToast('Please sign in to place your order', 'warning');
    openAuthModal('login');
    return;
  }

  if (cartItems.length === 0) {
    showToast('Your cart is empty! Add some delicious pastries first.', 'warning');
    return;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  try {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="spinner"></span> Placing Order...';

    const orderRes = await api.placeOrder();
    showToast(`🎉 Order #${orderRes.order.id} placed successfully!`, 'success');
    
    // Refresh cart & trigger callbacks
    await refreshCart();
    closeCartDrawer();

    orderPlacedCallbacks.forEach((cb) => cb(orderRes));
  } catch (err) {
    showToast(err.message || 'Failed to place order. Insufficient stock or transaction error.', 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Place Order & Checkout';
  }
}

export function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    isCartOpen = true;
  }
}

export function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    isCartOpen = false;
  }
}

export function toggleCartDrawer() {
  if (isCartOpen) {
    closeCartDrawer();
  } else {
    openCartDrawer();
  }
}

function renderCart() {
  const cartBadge = document.getElementById('cart-count-badge');
  const cartList = document.getElementById('cart-items-list');
  const cartTotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');
  const emptyCartMsg = document.getElementById('cart-empty-message');

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartBadge) {
    cartBadge.textContent = totalItemCount;
    cartBadge.style.display = totalItemCount > 0 ? 'inline-flex' : 'none';
  }

  if (cartTotalEl) {
    cartTotalEl.textContent = `$${cartTotal.toFixed(2)}`;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = cartItems.length === 0;
  }

  if (!cartList) return;

  if (cartItems.length === 0) {
    cartList.innerHTML = '';
    if (emptyCartMsg) emptyCartMsg.classList.remove('hidden');
    return;
  }

  if (emptyCartMsg) emptyCartMsg.classList.add('hidden');

  cartList.innerHTML = cartItems
    .map(
      (item) => `
    <div class="cart-item" data-item-id="${item.item_id}">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <span class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</span>
        <div class="cart-item-controls">
          <div class="qty-stepper">
            <button class="qty-btn btn-minus" data-id="${item.item_id}" data-qty="${item.quantity - 1}" title="Decrease">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn btn-plus" data-id="${item.item_id}" data-qty="${item.quantity + 1}" title="Increase" ${item.stock <= item.quantity ? 'disabled' : ''}>+</button>
          </div>
          <button class="cart-item-remove" data-id="${item.item_id}" title="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="cart-item-subtotal">
        $${parseFloat(item.subtotal).toFixed(2)}
      </div>
    </div>
  `
    )
    .join('');

  // Attach event listeners to quantity buttons and remove buttons
  cartList.querySelectorAll('.btn-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const qty = parseInt(btn.getAttribute('data-qty'), 10);
      updateItemQuantity(id, qty);
    });
  });

  cartList.querySelectorAll('.btn-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const qty = parseInt(btn.getAttribute('data-qty'), 10);
      updateItemQuantity(id, qty);
    });
  });

  cartList.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeCartItem(id);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
