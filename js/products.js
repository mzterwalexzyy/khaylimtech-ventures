// =========================================
//  KhaylimTech — Products Page Logic
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  loadFromURL();
  renderProducts();
  initFilters();
});

let activeCategories = [];
let activePriceMin = 0;
let activePriceMax = Infinity;
let activeSort = "default";
let activeSearch = "";

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat");
  if (cat) {
    activeCategories = [cat];
    const cb = document.querySelector(`.filter-option input[value="${cat}"]`);
    if (cb) cb.checked = true;
    // Update page title
    const catObj = CATEGORIES.find(c => c.id === cat);
    if (catObj) {
      const h1 = document.querySelector(".page-header h1");
      if (h1) h1.textContent = catObj.label;
    }
  }
  const q = params.get("q");
  if (q) {
    activeSearch = q.toLowerCase();
    const searchInput = document.querySelector("#products-search");
    if (searchInput) searchInput.value = q;
  }
}

function getFiltered() {
  return PRODUCTS.filter(p => {
    const catMatch = activeCategories.length === 0 || activeCategories.includes(p.category);
    const priceMatch = p.price >= activePriceMin && p.price <= activePriceMax;
    const searchMatch = activeSearch === "" ||
      p.name.toLowerCase().includes(activeSearch) ||
      p.category.toLowerCase().includes(activeSearch);
    return catMatch && priceMatch && searchMatch;
  }).sort((a, b) => {
    if (activeSort === "price-asc")  return a.price - b.price;
    if (activeSort === "price-desc") return b.price - a.price;
    if (activeSort === "rating")     return b.rating - a.rating;
    if (activeSort === "name")       return a.name.localeCompare(b.name);
    return 0;
  });
}

function renderProducts() {
  const grid = document.querySelector("#products-grid");
  const countEl = document.querySelector("#product-count");
  if (!grid) return;

  const filtered = getFiltered();
  if (countEl) countEl.textContent = filtered.length;

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:12px">🔍</div>
        <h3 style="color:var(--text-heading);margin-bottom:8px">No products found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderProductCard).join("");
}

function initFilters() {
  // Category checkboxes
  document.querySelectorAll(".filter-option input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => {
      activeCategories = Array.from(
        document.querySelectorAll(".filter-option input[type='checkbox']:checked")
      ).map(el => el.value);
      renderProducts();
    });
  });

  // Sort
  const sortSel = document.querySelector("#sort-select");
  if (sortSel) {
    sortSel.addEventListener("change", e => {
      activeSort = e.target.value;
      renderProducts();
    });
  }

  // Price filter apply
  const applyBtn = document.querySelector(".apply-filter");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const minEl = document.querySelector("#price-min");
      const maxEl = document.querySelector("#price-max");
      activePriceMin = minEl?.value ? Number(minEl.value) : 0;
      activePriceMax = maxEl?.value ? Number(maxEl.value) : Infinity;
      renderProducts();
    });
  }

  // Inline search
  const searchEl = document.querySelector("#products-search");
  if (searchEl) {
    searchEl.addEventListener("input", e => {
      activeSearch = e.target.value.toLowerCase();
      renderProducts();
    });
  }
}
