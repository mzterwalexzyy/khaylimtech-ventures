// =========================================
//  KhaylimTech — Product Detail Page
// =========================================

let _firebaseReady = false;

function setLoading(on) {
  const overlay = document.getElementById("detail-loading");
  const wrap    = document.getElementById("detail-layout-wrap");
  if (overlay) overlay.style.display = on ? "block" : "none";
  if (wrap)    wrap.style.display    = on ? "none"  : "";
}

function showNotFound() {
  setLoading(false);
  const wrap = document.getElementById("detail-layout-wrap");
  if (wrap) wrap.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px">
      <div style="font-size:3rem;margin-bottom:12px">😕</div>
      <h2 style="color:var(--text-heading);margin-bottom:8px">Product not found</h2>
      <a href="products.html" class="btn-gold" style="display:inline-flex;margin-top:16px">Browse Products</a>
    </div>`;
}

function getProductIdFromURL() {
  // Support both /product/lp001 (clean URL) and ?id=lp001 (query param)
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id");
  const pathMatch = window.location.pathname.match(/\/product\/(.+)/);
  return pathMatch ? pathMatch[1] : null;
}

function initDetailPage() {
  const id = getProductIdFromURL();
  const product = id ? getProductById(id) : null;

  if (!product) {
    if (!_firebaseReady) { setLoading(true); return; }
    showNotFound();
    return;
  }

  setLoading(false);
  renderDetail(product);
  renderRelated(product);
}

// Called by firebase-db.js when live Firestore data is ready
window.onFirebaseReady = () => {
  _firebaseReady = true;
  initDetailPage();
};

// On page load — try local data first, otherwise show loading overlay
document.addEventListener("DOMContentLoaded", () => {
  const id = getProductIdFromURL();
  const product = id ? getProductById(id) : null;
  if (product) {
    setLoading(false);
    initDetailPage();
  } else {
    setLoading(true); // hide layout, show spinner — Firebase will fill it
  }
});

const PLACEHOLDER = "placehold.co";

function renderDetail(p) {
  const mainImg = document.querySelector("#detail-main-img");
  const isPlaceholder = !p.image || p.image.includes(PLACEHOLDER);

  // If product only has video (no real image), show video player immediately
  if (p.video && isPlaceholder) {
    if (mainImg) mainImg.style.display = "none";
    showVideo(p.video);
  } else if (mainImg) {
    mainImg.src = p.image;
    mainImg.alt = p.name;
    mainImg.style.display = "block";
  }

  // Thumbnails + video thumb
  const thumbRow = document.querySelector("#detail-thumb-row");
  if (thumbRow) {
    // Build unique deduplicated images list
    const allImgs = [...new Set([p.image, ...(p.images || [])].filter(Boolean).filter(s => !s.includes(PLACEHOLDER)))];
    const imgThumbs = allImgs.map((src, i) => `
      <img src="${src}" alt="${p.name}" class="detail-thumb ${i===0?'active':''}"
        onclick="switchMainImg(this, '${src}')" loading="lazy">
    `).join("");
    const videoThumb = p.video ? `
      <div class="detail-thumb ${isPlaceholder ? 'active' : ''}"
        style="display:flex;align-items:center;justify-content:center;background:var(--bg-input);font-size:1.6rem;cursor:pointer;border:2px solid ${isPlaceholder ? 'var(--gold)' : 'var(--border)'}"
        onclick="showVideo('${p.video}')">🎬</div>` : "";
    thumbRow.innerHTML = imgThumbs + videoThumb;
  }

  // Text
  const catEl    = document.querySelector("#detail-cat");
  const nameEl   = document.querySelector("#detail-name");
  const priceEl  = document.querySelector("#detail-price");
  const oldPrice = document.querySelector("#detail-old-price");
  const ratingEl = document.querySelector("#detail-rating");
  const descEl   = document.querySelector("#detail-desc");
  const stockEl  = document.querySelector("#detail-stock");
  const breadEl  = document.querySelector("#breadcrumb-name");

  if (catEl)    catEl.textContent = CATEGORIES.find(c=>c.id===p.category)?.label || p.category;
  if (nameEl)   nameEl.textContent = p.name;
  if (priceEl)  priceEl.textContent = formatNGN(p.price);
  if (oldPrice) oldPrice.textContent = p.oldPrice ? formatNGN(p.oldPrice) : "";
  if (breadEl)  breadEl.textContent = p.name;
  if (descEl)   descEl.textContent = p.description;

  if (ratingEl) ratingEl.innerHTML = `
    <span class="stars">${"★".repeat(Math.round(p.rating))}${"☆".repeat(5-Math.round(p.rating))}</span>
    <span style="font-size:.85rem;color:var(--gold);font-weight:700">${p.rating}</span>
    <span style="font-size:.8rem;color:var(--text-muted)">(${p.reviews} reviews)</span>`;

  if (stockEl) {
    stockEl.className = `detail-stock ${p.inStock ? "in-stock" : "out-stock"}`;
    stockEl.innerHTML = p.inStock
      ? '<i class="fa-solid fa-circle-check"></i> In Stock — Ready to Ship'
      : '<i class="fa-solid fa-circle-xmark"></i> Out of Stock';
  }

  // Add to cart
  const addBtn = document.querySelector("#detail-add-btn");
  if (addBtn) {
    if (!p.inStock) {
      addBtn.disabled = true;
      addBtn.style.opacity = "0.5";
      addBtn.style.cursor = "not-allowed";
      addBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Out of Stock';
    }
    addBtn.addEventListener("click", () => {
      const qty = parseInt(document.querySelector("#qty-input")?.value || 1);
      Cart.add(p, qty);
      addBtn.classList.add("added");
      addBtn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart!';
      setTimeout(() => {
        addBtn.classList.remove("added");
        addBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Add to Cart';
      }, 2000);
    });
  }

  // Qty stepper
  const qtyInput = document.querySelector("#qty-input");
  document.querySelector("#qty-minus")?.addEventListener("click", () => {
    if (qtyInput && parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  document.querySelector("#qty-plus")?.addEventListener("click", () => {
    if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
  });
}

function switchMainImg(thumb, src) {
  // Hide video, show image
  const videoEl = document.querySelector("#detail-video-player");
  if (videoEl) videoEl.remove();
  const mainImg = document.querySelector("#detail-main-img");
  if (mainImg) { mainImg.style.display = "block"; mainImg.src = src; }
  document.querySelectorAll(".detail-thumb").forEach(t => t.classList.remove("active"));
  thumb.classList.add("active");
}

function showVideo(url) {
  // Hide image
  const mainImg = document.querySelector("#detail-main-img");
  if (mainImg) mainImg.style.display = "none";

  // Remove old player if exists
  const old = document.querySelector("#detail-video-player");
  if (old) old.remove();

  // Create new video player
  const videoEl = document.createElement("video");
  videoEl.id = "detail-video-player";
  videoEl.controls = true;
  videoEl.autoplay = true;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.preload = "auto";
  videoEl.src = url;
  videoEl.style.cssText = "width:100%;aspect-ratio:9/16;max-height:520px;object-fit:contain;border-radius:16px;background:#000;display:block;";

  // Insert before or after image in the same container
  const container = mainImg?.parentNode || document.querySelector(".detail-layout > div");
  if (container) container.insertBefore(videoEl, mainImg || container.firstChild);
}

function renderRelated(p) {
  const grid = document.querySelector("#related-grid");
  if (!grid) return;
  const related = getRelated(p, 4);
  grid.innerHTML = related.map(renderProductCard).join("");
}
