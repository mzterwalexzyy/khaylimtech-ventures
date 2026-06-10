// =========================================
//  KhaylimTech — Shared App Logic
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initSearch();
  Cart.updateBadge();
  initWhatsAppBubble();
});

// ─── WhatsApp Floating Bubble ────────────
function initWhatsAppBubble() {
  const bubble = document.createElement("div");
  bubble.innerHTML = `
    <a href="https://wa.me/2348083873316?text=Hello%20KhaylimTech!%20I%20need%20help%20with%20a%20product."
       target="_blank" id="wa-bubble" title="Chat with us on WhatsApp">
      <i class="fa-brands fa-whatsapp"></i>
      <span class="wa-tooltip">Chat with us!</span>
    </a>
  `;
  document.body.appendChild(bubble);

  // Inject bubble styles
  const style = document.createElement("style");
  style.textContent = `
    #wa-bubble {
      position: fixed;
      bottom: 28px;
      right: 24px;
      z-index: 9999;
      width: 58px;
      height: 58px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: #fff;
      box-shadow: 0 4px 20px rgba(37,211,102,0.45);
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: wa-pulse 2s infinite;
    }
    #wa-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(37,211,102,0.6);
    }
    .wa-tooltip {
      position: absolute;
      right: 68px;
      background: #fff;
      color: #111;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
      white-space: nowrap;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      font-family: 'Inter', sans-serif;
    }
    #wa-bubble:hover .wa-tooltip { opacity: 1; }
    @keyframes wa-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.45); }
      50%       { box-shadow: 0 4px 32px rgba(37,211,102,0.75); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Dark / Light Mode ──────────────────
function initTheme() {
  const saved = localStorage.getItem("khaylimtech_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
  // Swap assets after DOM is ready
  window.addEventListener("load", () => swapThemeAssets(saved));

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
  swapThemeAssets(theme);
}

function swapThemeAssets(theme) {
  const isDark = theme === "dark";

  // Swap all logos (navbar + footer)
  const logoSrc = isDark ? "assets/Darkmode_logo.png" : "assets/Lightmode_logo.png";
  document.querySelectorAll(".nav-logo img, .footer-logo img").forEach(img => {
    img.src = logoSrc;
  });

  // Swap hero banner (homepage only)
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.src = isDark ? "assets/dark_banner.jpeg" : "assets/light_banner.png";
  }
  // Swap hero flyer (right side visual)
  const heroFlyer = document.getElementById("hero-flyer");
  if (heroFlyer) {
    heroFlyer.src = isDark ? "assets/dark_banner.jpeg" : "assets/light_banner.png";
  }

  // Swap about page banners
  const bannerSrc = isDark ? "assets/dark_banner.jpeg" : "assets/light_banner.png";
  ["about-hero-img", "about-story-img"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = bannerSrc;
  });

  // Swap favicon to match theme
  const favicon = document.getElementById("favicon") || document.querySelector("link[rel='icon']");
  if (favicon) {
    favicon.href = isDark ? "assets/Darkmode_logo.png" : "assets/Lightmode_logo.png";
  }
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
        <div class="search-result-item" onclick="location.href='/product/${p.id}'">
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
        <a href="/product/${p.id}">
          ${mediaHtml}
        </a>
        ${badgeHtml}
        <button class="product-wishlist" onclick="toggleWishlist(this)" title="Wishlist">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <span class="product-cat">${CATEGORIES.find(c=>c.id===p.category)?.label || p.category}</span>
        <a href="/product/${p.id}">
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
        ${!p.inStock
          ? `<button class="product-add-btn" disabled style="opacity:.5;cursor:not-allowed;background:linear-gradient(135deg,#666,#444);color:#fff">
               <i class="fa-solid fa-ban"></i> Out of Stock
             </button>`
          : (() => {
              const inCart = Cart.getAll().some(i => i.id === p.id);
              return inCart
                ? `<button class="product-add-btn added" onclick="addToCartFromCard('${p.id}', this)">
                     <i class="fa-solid fa-circle-check"></i> Added to Cart
                   </button>`
                : `<button class="product-add-btn" onclick="addToCartFromCard('${p.id}', this)">
                     <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                   </button>`;
            })()
        }
      </div>
    </div>
  `;
}

function addToCartFromCard(id, btn) {
  const product = getProductById(id);
  if (!product) return;
  Cart.add(product);
  // Permanently mark as added — stays green until page refresh
  btn.classList.add("added");
  btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Added to Cart';
  btn.onclick = null; // prevent double-add spam; click again does nothing
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
