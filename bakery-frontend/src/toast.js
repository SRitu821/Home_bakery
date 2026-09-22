// Toast notification system
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  // Auto remove after duration
  const timer = setTimeout(() => {
    removeToast(toast);
  }, duration);

  toast._timer = timer;
}

function removeToast(toast) {
  if (toast.classList.contains('toast-leaving')) return;
  toast.classList.add('toast-leaving');
  clearTimeout(toast._timer);
  setTimeout(() => {
    if (toast.parentElement) toast.parentElement.removeChild(toast);
  }, 250);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
