// =========================================
//  KhaylimTech — Shared App Logic (Enhanced)
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initSearch();
  initScrollReveal();
  initNavScroll();
  initHeroEntrance();
  initTrustMarquee();
  initFaqAccordion();
  Cart.updateBadge();
  initWhatsAppBubble();
  initLivePurchaseToast();
  initInteractiveSurfaces();
  initHomeStacking();
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

  const style = document.createElement("style");
  style.textContent = `
    #wa-bubble {
      position: fixed;
      bottom: 28px;
      right: 24px;
      z-index: 9999;
      width: 58px;
      height: 58px;
      background: linear-gradient(135deg, #25D366, #128C7E);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: #fff;
      box-shadow: 0 4px 20px rgba(37,211,102,0.45);
      text-decoration: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
      animation: waPulse 2.5s ease-in-out infinite;
    }
    #wa-bubble:hover {
      transform: scale(1.13) translateY(-2px);
      box-shadow: 0 8px 32px rgba(37,211,102,0.65);
      animation-play-state: paused;
    }
    .wa-tooltip {
      position: absolute;
      right: 68px;
      background: #fff;
      color: #111;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 20px;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      opacity: 0;
      pointer-events: none;
      transform: translateX(6px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      font-family: 'Inter', sans-serif;
    }
    #wa-bubble:hover .wa-tooltip { opacity: 1; transform: translateX(0); }
    @keyframes waPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.45); }
      50%       { box-shadow: 0 4px 36px rgba(37,211,102,0.75); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Dark / Light Mode ──────────────────
function initTheme() {
  const saved = localStorage.getItem("khaylimtech_theme_v2") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
  window.addEventListener("load", () => swapThemeAssets(saved));

  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("khaylimtech_theme_v2", next);

      // Spin animation on icon swap
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.add("icon-swap");
        setTimeout(() => icon.classList.remove("icon-swap"), 350);
      }

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

  const logoSrc = isDark ? "/assets/Darkmode_logo.png" : "/assets/Lightmode_logo.png";
  document.querySelectorAll(".nav-logo img, .footer-logo img").forEach(img => {
    img.src = logoSrc;
  });

  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.src = isDark ? "/assets/dark_banner.jpeg" : "/assets/light_banner.png";
  }

  const heroFlyer = document.getElementById("hero-flyer");
  if (heroFlyer) {
    heroFlyer.src = isDark ? "/assets/dark_banner.jpeg" : "/assets/light_banner.png";
  }

  const bannerSrc = isDark ? "/assets/dark_banner.jpeg" : "/assets/light_banner.png";
  ["about-hero-img", "about-story-img"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = bannerSrc;
  });

  const favicon = document.getElementById("favicon") || document.querySelector("link[rel='icon']");
  if (favicon) {
    favicon.href = isDark ? "/assets/Darkmode_logo.png" : "/assets/Lightmode_logo.png";
  }
}

// ─── Nav Active State & Hamburger ───────
function initNav() {
  const path = window.location.pathname;

  // Determine active href — match clean URLs used in nav links
  let activePath = path;
  // Normalise trailing slash
  if (activePath !== "/" && activePath.endsWith("/")) activePath = activePath.slice(0, -1);

  // Support query param category pages (e.g. /phones → products.html?cat=phones)
  const cat = new URLSearchParams(window.location.search).get("cat");
  const catMap = { phones: "/phones", laptops: "/laptops", gaming: "/gaming", accessories: "/accessories" };
  if (cat && catMap[cat]) activePath = catMap[cat];

  document.querySelectorAll(".nav-links a, .mobile-nav a").forEach(a => {
    a.classList.remove("active");
    let href = a.getAttribute("href");
    if (href && href !== "/" && href.endsWith("/")) href = href.slice(0, -1);

    const isHome = (path === "/" || path === "" || path.endsWith("/index.html")) && href === "/";
    if (href === activePath || isHome) {
      a.classList.add("active");
    }
  });

  // Highlight Catalog dropdown trigger if viewing products or any category
  const isCatalogActive = ["/products", "/phones", "/laptops", "/gaming", "/accessories"].includes(activePath);
  document.querySelectorAll(".nav-dropdown-trigger").forEach(trigger => {
    if (isCatalogActive) trigger.classList.add("active");
  });

  // Dropdown hover & click accessibility
  document.querySelectorAll(".nav-dropdown").forEach(dropdown => {
    const trigger = dropdown.querySelector(".nav-dropdown-trigger");
    if (trigger) {
      trigger.addEventListener("click", e => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          dropdown.classList.toggle("open");
        }
      });
    }
  });

  // Hamburger
  const hamburger = document.querySelector(".hamburger");
  const mobileNav = document.querySelector(".mobile-nav");
  if (hamburger && mobileNav) {
    hamburger.setAttribute("aria-expanded", "false");
    mobileNav.setAttribute("aria-hidden", "true");
    hamburger.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      hamburger.classList.toggle("is-open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      mobileNav.setAttribute("aria-hidden", String(!isOpen));
    });
    // Close on outside click
    document.addEventListener("click", e => {
      if (!e.target.closest(".navbar")) {
        mobileNav.classList.remove("open");
        hamburger.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) {
        mobileNav.classList.remove("open");
        hamburger.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");
        hamburger.focus();
      }
    });
  }
}

// ─── Navbar Transparent → Glass on Scroll ─
function initNavScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  let ticking = false;
  const check = () => {
    if (window.scrollY > 30) {
      navbar.classList.add("nav-scrolled");
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("nav-scrolled");
      navbar.classList.remove("scrolled");
    }
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(check);
      ticking = true;
    }
  }, { passive: true });

  check(); // run on load
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

// ─── Scroll Reveal (IntersectionObserver) ─
function initScrollReveal() {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal, .reveal-stagger").forEach(el => {
    revealObserver.observe(el);
  });

  // Also re-run for dynamically added elements (Firebase products)
  window._revealObserver = revealObserver;
}

// Call this after rendering dynamic content (Firebase products)
function reRunReveal() {
  document.querySelectorAll(".reveal:not(.visible), .reveal-stagger:not(.visible)").forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("visible");
    } else if (window._revealObserver) {
      window._revealObserver.observe(el);
    }
  });
}

// Replays concise entrance motion when dynamic product data changes.
function revealRenderedProducts(container) {
  if (!container) return;
  const cards = Array.from(container.querySelectorAll(".product-card"));
  cards.forEach((card, index) => {
    card.style.setProperty("--card-index", Math.min(index, 7));
    card.classList.remove("is-rendered");
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => cards.forEach(card => card.classList.add("is-rendered")));
  });
}

function initInteractiveSurfaces() {
  const productContainers = document.querySelectorAll(".product-grid");
  productContainers.forEach(container => {
    revealRenderedProducts(container);
    new MutationObserver(() => revealRenderedProducts(container)).observe(container, { childList: true });
  });
}

function initHomeStacking() {
  const panels = Array.from(document.querySelectorAll(".editorial-stack-panel, .home-stack-panel"));
  if (!panels.length) return;

  panels.forEach((panel, index) => panel.style.setProperty("--stack-order", index + 1));

  if (!window.matchMedia("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)").matches) {
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  }, {
    threshold: 0.12,
    rootMargin: "-52px 0px -55% 0px"
  });

  panels.forEach(panel => observer.observe(panel));
}

// ─── Hero Blur-Fade Entrance ────────────
function initHeroEntrance() {
  const wrap = document.querySelector(".hero-content-wrap");
  if (!wrap) return;

  // Trigger on next frame after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      wrap.classList.add("revealed");
    }, 80);
  });
}

// ─── Trust Strip Marquee Clone ──────────
function initTrustMarquee() {
  const inner = document.querySelector(".trust-inner");
  if (!inner) return;

  // Clone items for seamless loop
  const items = Array.from(inner.children);
  if (!items.length) return;

  items.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    inner.appendChild(clone);
  });
}

// ─── FAQ Smooth Accordion ───────────────
function initFaqAccordion() {
  // Only init if there are faq items on the page
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  // The CSS now handles the smooth max-height animation.
  // Just make sure the first item isn't open by default.
  items.forEach(item => item.classList.remove("open"));
}

// ─── Render Product Card ─────────────────
const PLACEHOLDER_IMG = "placehold.co";

function renderProductCard(p) {
  const badgeHtml = p.badge
    ? `<span class="product-badge badge-${p.badge}">${p.badge === "hot" ? "Popular" : p.badge === "new" ? "New" : p.badge}</span>`
    : (p.inStock ? "" : '<span class="product-badge badge-out">Out of Stock</span>');

  const isPlaceholder = !p.image || p.image.includes(PLACEHOLDER_IMG);
  const mediaHtml = (p.video && isPlaceholder)
    ? `<video src="${p.video}" autoplay muted loop playsinline
         style="width:100%;height:100%;object-fit:cover;display:block;"
         onerror="this.style.display='none'"></video>`
    : `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/Lightmode_logo.png'">`;

  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="product-img-wrap">
        <a href="/product/${p.id}">
          ${mediaHtml}
        </a>
        ${badgeHtml}
        <button class="product-wishlist${isWishlisted(p.id) ? ' active' : ''}" onclick="toggleWishlist(this,'${p.id}')" title="Wishlist" aria-label="${isWishlisted(p.id) ? 'Remove' : 'Add'} ${p.name} ${isWishlisted(p.id) ? 'from' : 'to'} wishlist" aria-pressed="${isWishlisted(p.id)}">
          <i class="${isWishlisted(p.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <span class="product-cat">${CATEGORIES.find(c=>c.id===p.category)?.label || p.category}</span>
        <a href="/product/${p.id}">
          <div class="product-name">${p.name}</div>
        </a>
        ${p.reviews > 0 ? `<div class="product-rating">
          <span class="stars">${"★".repeat(Math.round(p.rating))}${"☆".repeat(5-Math.round(p.rating))}</span>
          <span class="rating-count">(${p.reviews})</span>
        </div>` : ""}
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
    </article>
  `;
}

function addToCartFromCard(id, btn) {
  const product = getProductById(id);
  if (!product) return;
  Cart.add(product);
  btn.classList.add("added", "is-confirming");
  btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Added to Cart</span>';
  setTimeout(() => btn.classList.remove("is-confirming"), 500);
  btn.onclick = null;
}

// ─── Wishlist (persisted to localStorage) ─
function getWishlist() {
  try { return JSON.parse(localStorage.getItem("khaylimtech_wishlist")) || []; }
  catch { return []; }
}

function saveWishlist(list) {
  localStorage.setItem("khaylimtech_wishlist", JSON.stringify(list));
}

function isWishlisted(id) {
  return getWishlist().includes(id);
}

function toggleWishlist(btn, id) {
  let list = getWishlist();
  const already = list.includes(id);
  if (already) {
    list = list.filter(x => x !== id);
  } else {
    list.push(id);
  }
  saveWishlist(list);

  const active = !already;
  btn.classList.toggle("active", active);
  btn.classList.remove("is-popping");
  void btn.offsetWidth;
  btn.classList.add("is-popping");
  btn.setAttribute("aria-pressed", String(active));
  btn.setAttribute("aria-label", `${active ? 'Remove' : 'Add'} item ${active ? 'from' : 'to'} wishlist`);
  btn.innerHTML = active
    ? '<i class="fa-solid fa-heart"></i>'
    : '<i class="fa-regular fa-heart"></i>';

  showToast(active
    ? '<i class="fa-solid fa-heart" style="color:#ef4444"></i> <span>Added to wishlist</span>'
    : '<i class="fa-regular fa-heart"></i> <span>Removed from wishlist</span>'
  );
}

// ─── Global Newsletter Handler ──────────
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector("input");
  const email = input ? input.value.trim() : "";
  if (!email) return;

  if (typeof firebase !== "undefined") {
    try {
      firebase.firestore().collection("subscribers").add({
        email: email,
        date: new Date().toISOString(),
        source: window.location.pathname
      }).catch(() => {});
    } catch (_) {}
  }

  showToast('<i class="fa-solid fa-envelope"></i> <span>Thanks for subscribing!</span>');
  if (input) input.value = "";
}

// ─── Live Verified Purchase Toast ───────
function initLivePurchaseToast() {
  const toastEl = document.getElementById("live-purchase-toast");
  if (!toastEl) return;

  const customerEl = document.getElementById("toast-customer");
  const itemEl = document.getElementById("toast-item");
  const timeEl = document.getElementById("toast-time");
  const closeBtn = document.getElementById("toast-close");

  const PURCHASES = [
    { customer: "Dr. Babatunde from UCH, Ibadan", item: "Purchased Apple iPhone 15 Pro Max (256GB)", time: "8 mins ago • Same-Day Dispatch" },
    { customer: "Chioma from Bodija, Ibadan", item: "Purchased MacBook Pro 14\" M3 Pro", time: "18 mins ago • Verified Buyer" },
    { customer: "Farouk from Oluyole, Ibadan", item: "Purchased PS5 Slim + Extra DualSense", time: "31 mins ago • Inspect on Delivery" },
    { customer: "Aisha from Lekki, Lagos", item: "Purchased Apple iPhone 15 Pro + AirPods Pro 2", time: "44 mins ago • Interstate Waybill" },
    { customer: "Segun from Ring Road, Ibadan", item: "Purchased Samsung Galaxy S24 Ultra (512GB)", time: "1 hr ago • Verified Order" },
    { customer: "Blessing from UI Agbowo, Ibadan", item: "Purchased Apple iPad Air M2 11-inch", time: "1 hr ago • Same-Day Dispatch" }
  ];

  let currentIndex = 0;
  let hideTimer = null;
  let intervalTimer = null;
  let isDismissed = false;

  function showNextPurchase() {
    if (isDismissed) return;
    const p = PURCHASES[currentIndex];
    if (customerEl) customerEl.textContent = p.customer;
    if (itemEl) itemEl.textContent = p.item;
    if (timeEl) timeEl.textContent = p.time;

    toastEl.classList.add("show");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 4500);

    currentIndex = (currentIndex + 1) % PURCHASES.length;
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      isDismissed = true;
      clearTimeout(hideTimer);
      clearInterval(intervalTimer);
      toastEl.classList.remove("show");
    });
  }

  // First toast appears after 3.5s, then cycles every 9s
  setTimeout(() => {
    showNextPurchase();
    intervalTimer = setInterval(showNextPurchase, 9500);
  }, 3500);
}
