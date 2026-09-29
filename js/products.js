// =========================================
//  KhaylimTech — Products Page Logic
// =========================================

let activeCategories = [];
let activeBrand = "all";
let activePriceMin = 0;
let activePriceMax = Infinity;
let activeSort = "default";
let activeSearch = "";
let inStockOnly = false;

document.addEventListener("DOMContentLoaded", () => {
  loadFromURL();
  updatePillCounts();
  renderProducts();
  initFilters();
  initToolbar();
  initMobileFilters();
});

// Re-render when Firebase live data arrives
window.onFirebaseReady = () => {
  updatePillCounts();
  renderProducts();
};

function updatePillCounts() {
  const allEl = document.querySelector("#pill-all-count");
  const phEl  = document.querySelector("#pill-phones-count");
  const lpEl  = document.querySelector("#pill-laptops-count");
  const gmEl  = document.querySelector("#pill-gaming-count");
  const acEl  = document.querySelector("#pill-accessories-count");

  if (allEl) allEl.textContent = PRODUCTS.length;
  if (phEl)  phEl.textContent  = PRODUCTS.filter(p => p.category === "phones").length;
  if (lpEl)  lpEl.textContent  = PRODUCTS.filter(p => p.category === "laptops").length;
  if (gmEl)  gmEl.textContent  = PRODUCTS.filter(p => p.category === "gaming").length;
  if (acEl)  acEl.textContent  = PRODUCTS.filter(p => p.category === "accessories").length;
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const pathCat = window.location.pathname.replace(/^\//, "").replace(/\.html$/, "");
  const validCats = ["phones", "laptops", "gaming", "accessories"];
  const cat = params.get("cat") || (validCats.includes(pathCat) ? pathCat : null);

  if (cat) {
    activeCategories = [cat];
    const cb = document.querySelector(`.filter-option input[value="${cat}"]`);
    if (cb) cb.checked = true;

    // Update active pill button
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-cat") === cat);
    });

    // Update editorial hero banner tailored to category
    updateCategoryHero(cat);
  } else {
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-cat") === "all");
    });
    updateCategoryHero("all");
  }

  const q = params.get("q");
  if (q) {
    activeSearch = q.toLowerCase();
    const searchInput = document.querySelector("#products-search");
    if (searchInput) searchInput.value = q;
  }
}

function updateCategoryHero(cat) {
  const badgeEl = document.querySelector("#cat-hero-badge-text");
  const titleEl = document.querySelector("#cat-hero-title");
  const descEl  = document.querySelector("#cat-hero-desc");
  const h1El    = document.querySelector(".page-header h1");

  const heroes = {
    phones: {
      badge: "FLAGSHIP SMARTPHONES • FACTORY SEALED",
      title: 'Flagship <span class="gradient-gold-text">Smartphones.</span>',
      h1: "Phones",
      desc: "Factory sealed Apple iPhones, Samsung Galaxy flagships, and premium Android devices. Verifiable IMEI, 1-year warranty, and same-day delivery in Ibadan."
    },
    laptops: {
      badge: "APPLE SILICON & PRO WORKSTATIONS",
      title: 'Pro Laptops & <span class="gradient-gold-text">MacBooks.</span>',
      h1: "Laptops",
      desc: "Genuine Apple MacBook Pro, MacBook Air M2/M3, HP EliteBooks, and business laptops. Factory fresh with complimentary old-to-new data transfer."
    },
    gaming: {
      badge: "PLAYSTATION 5 & NEXT-GEN CONSOLES",
      title: 'Next-Gen <span class="gradient-gold-text">Gaming Gear.</span>',
      h1: "Gaming",
      desc: "Brand new Sony PlayStation 5 consoles, DualSense wireless controllers, and gaming headsets. Inspected on delivery across Ibadan."
    },
    accessories: {
      badge: "STUDIO AUDIO & ORIGINAL GEAR",
      title: 'Studio Audio & <span class="gradient-gold-text">Accessories.</span>',
      h1: "Accessories",
      desc: "Original Apple AirPods Pro, studio wireless speakers, high-speed GaN chargers, and authentic accessories at guaranteed best prices."
    },
    all: {
      badge: "100% FACTORY-SEALED GUARANTEE",
      title: 'All <span class="gradient-gold-text">Products.</span>',
      h1: "All Products",
      desc: "Genuine iPhones, flagship Samsung devices, MacBooks, PS5 consoles, and original accessories. Tested, verified, with 1-year warranty and same-day delivery in Ibadan."
    }
  };

  const c = heroes[cat] || heroes.all;
  if (badgeEl) badgeEl.textContent = c.badge;
  if (titleEl) titleEl.innerHTML   = c.title;
  if (descEl)  descEl.textContent  = c.desc;
  if (h1El)    h1El.textContent    = c.h1;
}

function getFiltered() {
  return PRODUCTS.filter(p => {
    const catMatch = activeCategories.length === 0 || activeCategories.includes(p.category);
    const priceMatch = p.price >= activePriceMin && p.price <= activePriceMax;
    const searchMatch = activeSearch === "" ||
      p.name.toLowerCase().includes(activeSearch) ||
      p.category.toLowerCase().includes(activeSearch);
    const stockMatch = !inStockOnly || p.inStock;

    let brandMatch = true;
    if (activeBrand !== "all") {
      const nameLower = p.name.toLowerCase();
      if (activeBrand === "apple")   brandMatch = nameLower.includes("iphone") || nameLower.includes("macbook") || nameLower.includes("airpods") || nameLower.includes("apple");
      if (activeBrand === "samsung") brandMatch = nameLower.includes("samsung") || nameLower.includes("galaxy");
      if (activeBrand === "sony")    brandMatch = nameLower.includes("playstation") || nameLower.includes("ps5") || nameLower.includes("sony");
      if (activeBrand === "hp")      brandMatch = nameLower.includes("hp");
    }

    return catMatch && priceMatch && searchMatch && stockMatch && brandMatch;
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
  const mobileCountEl = document.querySelector("#mobile-product-count");
  const displayCountEl = document.querySelector("#product-count-display");
  if (!grid) return;

  const filtered = getFiltered();
  if (countEl) countEl.textContent = filtered.length;
  if (mobileCountEl) mobileCountEl.textContent = filtered.length;
  if (displayCountEl) displayCountEl.textContent = `Showing ${filtered.length} verified item${filtered.length === 1 ? '' : 's'}`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:12px"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3 style="color:var(--text-heading);margin-bottom:8px">No products found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(renderProductCard).join("");
  const scrollContainer = document.querySelector("#products-main-scroll");
  if (scrollContainer && scrollContainer.scrollTop > 80) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (typeof reRunReveal === "function") {
    setTimeout(reRunReveal, 50);
  }
}

function initToolbar() {
  // Brand Chips
  document.querySelectorAll(".brand-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".brand-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeBrand = chip.getAttribute("data-brand") || "all";
      renderProducts();
    });
  });

  // Top Sort Select sync with sidebar sort select
  const topSort = document.querySelector("#sort-select-top");
  const sideSort = document.querySelector("#sort-select");

  if (topSort) {
    topSort.addEventListener("change", e => {
      activeSort = e.target.value;
      if (sideSort) sideSort.value = activeSort;
      renderProducts();
    });
  }
  if (sideSort) {
    sideSort.addEventListener("change", e => {
      activeSort = e.target.value;
      if (topSort) topSort.value = activeSort;
      renderProducts();
    });
  }
}

function initFilters() {
  // Category checkboxes
  document.querySelectorAll(".filter-option input[type='checkbox']:not(#filter-instock)").forEach(cb => {
    cb.addEventListener("change", () => {
      activeCategories = Array.from(
        document.querySelectorAll(".filter-option input[type='checkbox']:not(#filter-instock):checked")
      ).map(el => el.value);

      // Sync quick switcher pill buttons
      document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        const cat = btn.getAttribute("data-cat");
        if (activeCategories.length === 1 && activeCategories[0] === cat) {
          btn.classList.add("active");
          updateCategoryHero(cat);
        } else if (activeCategories.length === 0 && cat === "all") {
          btn.classList.add("active");
          updateCategoryHero("all");
        } else {
          btn.classList.remove("active");
        }
      });

      renderProducts();
    });
  });

  const stockFilter = document.querySelector("#filter-instock");
  if (stockFilter) {
    stockFilter.addEventListener("change", event => {
      inStockOnly = event.target.checked;
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
      if (window.innerWidth <= 768) {
        document.querySelector("#catalog-filters")?.classList.remove("mobile-open");
        document.querySelector(".mobile-filter-toggle")?.setAttribute("aria-expanded", "false");
        document.body.classList.remove("filters-open");
      }
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

function initMobileFilters() {
  const toggle = document.querySelector(".mobile-filter-toggle");
  const sidebar = document.querySelector("#catalog-filters");
  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("mobile-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("filters-open", isOpen);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && sidebar.classList.contains("mobile-open")) {
      sidebar.classList.remove("mobile-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("filters-open");
      toggle.focus();
    }
  });
}
