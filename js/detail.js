// =========================================
//  KhaylimTech — Product Detail Page
// =========================================

function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = id ? getProductById(id) : null;

  if (!product) {
    document.querySelector(".detail-layout").innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 20px">
        <div style="font-size:3rem;margin-bottom:12px">😕</div>
        <h2 style="color:var(--text-heading);margin-bottom:8px">Product not found</h2>
        <a href="products.html" class="btn-gold" style="display:inline-flex;margin-top:16px">Browse Products</a>
      </div>`;
    return;
  }

  renderDetail(product);
  renderRelated(product);
}

// Called by firebase-db.js when live data is ready
window.onFirebaseReady = initDetailPage;

// Also run on DOMContentLoaded as fallback (uses local data.js)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.firebaseLoaded) initDetailPage();
});

function renderDetail(p) {
  // Main image
  const mainImg = document.querySelector("#detail-main-img");
  if (mainImg) { mainImg.src = p.image; mainImg.alt = p.name; }

  // Thumbnails + video thumb if present
  const thumbRow = document.querySelector("#detail-thumb-row");
  if (thumbRow) {
    const imgThumbs = (p.images || [p.image]).map((src, i) => `
      <img src="${src}" alt="${p.name}" class="detail-thumb ${i===0?'active':''}"
        onclick="switchMainImg(this, '${src}')" loading="lazy">
    `).join("");
    const videoThumb = p.video ? `
      <div class="detail-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--bg-input);font-size:1.6rem;cursor:pointer"
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
  const mainImg = document.querySelector("#detail-main-img");
  if (mainImg) mainImg.style.display = "none";
  let videoEl = document.querySelector("#detail-video-player");
  if (!videoEl) {
    videoEl = document.createElement("video");
    videoEl.id = "detail-video-player";
    videoEl.controls = true;
    videoEl.style.cssText = "width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:16px;background:#000;";
    mainImg?.parentNode.insertBefore(videoEl, mainImg);
  }
  videoEl.src = url;
  videoEl.play();
}

function renderRelated(p) {
  const grid = document.querySelector("#related-grid");
  if (!grid) return;
  const related = getRelated(p, 4);
  grid.innerHTML = related.map(renderProductCard).join("");
}
