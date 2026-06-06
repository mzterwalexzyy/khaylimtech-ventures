// =========================================
//  KhaylimTech — Shared App Logic
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initSearch();
  Cart.updateBadge();
});

// ─── Dark / Light Mode ──────────────────
function initTheme() {
  const saved = localStorage.getItem("khaylimtech_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("khaylimtech_theme", next);
      updateThemeIcon(next);
    });
  });
}

function updateThemeIcon(theme) {
  document.querySelectorAll(".theme-toggle i").forEach(icon => {
    icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  });
}

// ─── Nav Active State & Hamburger ───────
function initNav() {
  const path     = window.location.pathname;
  const pageName = path.split("/").pop();                        // e.g. "products.html"
  const cat      = new URLSearchParams(window.location.search).get("cat"); // e.g. "phones"
  const fullHref = pageName + (cat ? `?cat=${cat}` : "");       // e.g. "products.html?cat=phones"

  document.querySelectorAll(".nav-links a, .mobile-nav a").forEach(a => {
    a.classList.remove("active");
    const href = a.getAttribute("href");
    const isHome = (path.endsWith("/") || pageName === "" || pageName === "index.html") && href === "index.html";
    // Match exact href including query string
    if (href === fullHref || isHome || (!cat && href === pageName)) {
      a.classList.add("active");
    }
  });

  const hamburger = document.querySelector(".hamburger");
  const mobileNav = document.querySelector(".mobile-nav");
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
    });
  }
}

// ─── Global Search ──────────────────────
function initSearch() {
  const inputs = document.querySelectorAll(".nav-search input");
  inputs.forEach(input => {
    const dropdown = input.closest(".nav-search").querySelector(".search-dropdown");
    if (!dropdown) return;

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { dropdown.classList.remove("open"); return; }

      const matches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ).slice(0, 6);

      if (!matches.length) { dropdown.classList.remove("open"); return; }

      dropdown.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="location.href='product-detail.html?id=${p.id}'">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="sri-info">
            <div class="sri-name">${p.name}</div>
            <div class="sri-price">${formatNGN(p.price)}</div>
          </div>
        </div>
      `).join("");
      dropdown.classList.add("open");
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".nav-search")) dropdown.classList.remove("open");
    });
  });
}

const PLACEHOLDER_IMG = "placehold.co";

// ─── Render Product Card ─────────────────
function renderProductCard(p) {
  const badgeHtml = p.badge
    ? `<span class="product-badge badge-${p.badge}">${p.badge === "hot" ? "🔥 Hot" : p.badge === "new" ? "✨ New" : p.badge}</span>`
    : (p.inStock ? "" : '<span class="product-badge badge-out">Out of Stock</span>');

  const isPlaceholder = !p.image || p.image.includes(PLACEHOLDER_IMG);
  const mediaHtml = (p.video && isPlaceholder)
    ? `<video src="${p.video}" autoplay muted loop playsinline
         style="width:100%;height:100%;object-fit:cover;display:block;"
         onerror="this.style.display='none'"></video>`
    : `<img src="${p.image}" alt="${p.name}" loading="lazy">`;

  return `
    <div class="product-card">
      <div class="product-img-wrap">
        <a href="product-detail.html?id=${p.id}">
          ${mediaHtml}
        </a>
        ${badgeHtml}
        <button class="product-wishlist" onclick="toggleWishlist(this)" title="Wishlist">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <span class="product-cat">${CATEGORIES.find(c=>c.id===p.category)?.label || p.category}</span>
        <a href="product-detail.html?id=${p.id}">
          <div class="product-name">${p.name}</div>
        </a>
        <div class="product-rating">
          <span class="stars">${"★".repeat(Math.round(p.rating))}${"☆".repeat(5-Math.round(p.rating))}</span>
          <span class="rating-count">(${p.reviews})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatNGN(p.price)}</span>
          ${p.oldPrice ? `<span class="product-price-old">${formatNGN(p.oldPrice)}</span>` : ""}
        </div>
        <button class="product-add-btn" onclick="addToCartFromCard('${p.id}', this)" ${!p.inStock ? "disabled style='opacity:.5;cursor:not-allowed'" : ""}>
          <i class="fa-solid fa-bag-shopping"></i>
          ${p.inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  `;
}

function addToCartFromCard(id, btn) {
  const product = getProductById(id);
  if (!product) return;
  Cart.add(product);
  btn.classList.add("added");
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  setTimeout(() => {
    btn.classList.remove("added");
    btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Add to Cart';
  }, 1800);
}

function toggleWishlist(btn) {
  btn.classList.toggle("active");
  const active = btn.classList.contains("active");
  btn.innerHTML = active ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
  showToast(active
    ? '<i class="fa-solid fa-heart" style="color:#ef4444"></i> <span>Added to wishlist</span>'
    : '<i class="fa-regular fa-heart"></i> <span>Removed from wishlist</span>'
  );
}
