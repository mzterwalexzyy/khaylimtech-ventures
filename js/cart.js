// =========================================
//  KhaylimTech — Cart Logic (localStorage)
// =========================================

const Cart = (() => {
  const KEY = "khaylimtech_cart";

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  }

  function add(product, qty = 1) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) {
      items[idx].qty += qty;
    } else {
      items.push({ ...product, qty });
    }
    save(items);
    showToast(`<i class="fa-solid fa-bag-shopping"></i> <span><strong>${product.name}</strong> added to cart</span>`);
  }

  function remove(id) {
    save(getAll().filter(i => i.id !== id));
  }

  function updateQty(id, qty) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx > -1) {
      if (qty < 1) { remove(id); return; }
      items[idx].qty = qty;
      save(items);
    }
  }

  function count() {
    return getAll().reduce((sum, i) => sum + i.qty, 0);
  }

  function subtotal() {
    return getAll().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function clear() { save([]); }

  function updateBadge() {
    const total = count();
    document.querySelectorAll(".cart-badge").forEach(el => {
      el.textContent = total;
      el.classList.toggle("visible", total > 0);
    });
  }

  return { getAll, add, remove, updateQty, count, subtotal, clear, updateBadge };
})();

// ─── Toast Notification ─────────────────
function showToast(html, duration = 2800) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = html;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
