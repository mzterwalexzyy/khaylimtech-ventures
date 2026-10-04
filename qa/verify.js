// Comprehensive verification suite for KhaylimTech Storefront
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let detectedPort = process.env.PORT || 5173;
const serverPortFile = path.resolve(__dirname, '..', '.server-port');
if (fs.existsSync(serverPortFile)) {
  try {
    const p = fs.readFileSync(serverPortFile, 'utf8').trim();
    if (p) detectedPort = p;
  } catch (e) {}
}
const BASE_URL = process.env.BASE_URL || `http://localhost:${detectedPort}`;
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n=============================================');
  console.log('  KhaylimTech Automated Storefront Audit');
  console.log('=============================================\n');

  // 1. ROUTE VERIFICATION
  console.log('1. Verifying Netlify/Dev-Server HTTP Routes...');
  const routes = [
    ['/', 'Home page'],
    ['/products', 'All Products catalog'],
    ['/phones', 'Phones category route'],
    ['/laptops', 'Laptops category route'],
    ['/gaming', 'Gaming category route'],
    ['/accessories', 'Accessories category route'],
    ['/product/ph001', 'Product detail clean URL route'],
    ['/cart', 'Cart page'],
    ['/about', 'About Us page'],
    ['/contact', 'Contact page'],
    ['/faq', 'FAQ page'],
    ['/how-to-order', 'How To Order page']
  ];

  for (const [route, label] of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      assert(res.status === 200, `Route ${route} (${label}) returned HTTP 200 (Got ${res.status})`);
      const text = await res.text();
      assert(text.length > 500, `Route ${route} returned valid HTML body (>500 bytes)`);
    } catch (err) {
      assert(false, `Route ${route} (${label}) failed to fetch: ${err.message}`);
    }
  }

  // 2. CORE ASSETS VERIFICATION
  console.log('\n2. Verifying Core CSS & JS Assets...');
  const assets = [
    '/css/style.css',
    '/css/responsive.css',
    '/css/animations.css',
    '/css/professional.css',
    '/js/data.js',
    '/js/cart.js',
    '/js/app.js',
    '/js/products.js',
    '/js/detail.js',
    '/js/firebase-db.js',
    '/assets/logo.jpeg',
    '/assets/Lightmode_logo.png'
  ];

  for (const asset of assets) {
    try {
      const res = await fetch(`${BASE_URL}${asset}`);
      assert(res.status === 200, `Asset ${asset} returned HTTP 200`);
    } catch (err) {
      assert(false, `Asset ${asset} failed to fetch: ${err.message}`);
    }
  }

  // 3. CATALOG PINNED VIEWPORT & SPECIFICITY
  console.log('\n3. Verifying Catalog Pinned Layout & Design System Tokens...');
  const animCss = fs.readFileSync(path.join(ROOT, 'css', 'animations.css'), 'utf-8');
  assert(animCss.includes('body.catalog-page'), 'animations.css contains body.catalog-page rules');
  assert(animCss.includes('padding-top: 80px; /* navbar height */'), 'animations.css catalog-page desktop padding-top is 80px');
  assert(animCss.includes('height: 80px;') && animCss.includes('body.catalog-page .navbar'), 'animations.css catalog-page desktop navbar height is 80px');
  assert(animCss.includes('@media (min-width: 769px) and (max-width: 900px)'), 'animations.css contains tablet 769px-900px navbar height 70px rule');

  const productsHtml = fs.readFileSync(path.join(ROOT, 'products.html'), 'utf-8');
  assert(productsHtml.includes('class="catalog-page"'), 'products.html has class="catalog-page" on <body>');
  assert(productsHtml.includes('class="catalog-viewport"'), 'products.html has catalog-viewport wrapper');
  assert(productsHtml.includes('class="mobile-filter-toggle"'), 'products.html has mobile-filter-toggle button');
  assert(productsHtml.includes('id="catalog-filters"'), 'products.html has sidebar with id="catalog-filters"');
  assert(productsHtml.includes('id="products-main-scroll"'), 'products.html has products-main-scroll container');

  // 4. CART INTERACTIONS & INLINE CONFIRMATION
  console.log('\n4. Verifying Cart Logic & Non-blocking Inline Confirmation UI...');
  const cartHtml = fs.readFileSync(path.join(ROOT, 'cart.html'), 'utf-8');
  assert(!cartHtml.includes('confirm('), 'cart.html contains ZERO native confirm() popups');
  assert(cartHtml.includes('showClearConfirm'), 'cart.html defines showClearConfirm()');
  assert(cartHtml.includes('hideClearConfirm'), 'cart.html defines hideClearConfirm()');
  assert(cartHtml.includes('confirmClearCart'), 'cart.html defines confirmClearCart()');
  assert(cartHtml.includes('clear-confirm-group'), 'cart.html contains inline clear-confirm-group container');

  // Test Cart module logic using Node VM
  const cartJs = fs.readFileSync(path.join(ROOT, 'js', 'cart.js'), 'utf-8');
  const dataJs = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf-8');

  const mockStorage = {};
  const sandbox = {
    localStorage: {
      getItem: key => mockStorage[key] || null,
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: key => { delete mockStorage[key]; },
      clear: () => { for (let k in mockStorage) delete mockStorage[k]; }
    },
    document: {
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({
        className: '',
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        appendChild: () => {},
        remove: () => {},
        setAttribute: () => {},
        getAttribute: () => null
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {}
      }
    },
    showToast: () => {},
    setTimeout: fn => setTimeout(fn, 0),
    clearTimeout: id => clearTimeout(id),
    requestAnimationFrame: fn => setTimeout(fn, 0),
    cancelAnimationFrame: () => {},
    window: {},
    console: console
  };
  vm.createContext(sandbox);
  const dataExports = vm.runInContext(dataJs + '\n;({ PRODUCTS, CATEGORIES, formatNGN });', sandbox);
  const cartExports = vm.runInContext(cartJs + '\n;({ Cart });', sandbox);

  const Cart = cartExports.Cart;
  const PRODUCTS = dataExports.PRODUCTS;
  const formatNGN = dataExports.formatNGN;

  assert(Array.isArray(PRODUCTS) && PRODUCTS.length >= 10, `PRODUCTS array loaded with ${PRODUCTS.length} items`);
  const phones = PRODUCTS.filter(p => p.category === 'phones');
  assert(phones.length >= 4, `Phone seed products exist (${phones.length} phones)`);

  Cart.clear();
  assert(Cart.count() === 0, 'Cart starts with 0 items after clear');
  assert(Cart.subtotal() === 0, 'Cart subtotal is 0 when empty');

  const testProduct = PRODUCTS[0];
  Cart.add(testProduct);
  assert(Cart.count() === 1, `Cart.add() incremented count to 1`);
  assert(Cart.subtotal() === testProduct.price, `Cart.subtotal() matches product price (${testProduct.price})`);

  Cart.updateQty(testProduct.id, 3);
  assert(Cart.count() === 3, 'Cart.updateQty(id, 3) updated item count to 3');
  assert(Cart.subtotal() === testProduct.price * 3, 'Cart.subtotal() is exact 3x product price');

  // Verify WhatsApp message format
  const items = Cart.getAll();
  const waMsg = items.map(i => `• ${i.name} x${i.qty} = ${formatNGN(i.price * i.qty)}`).join("\n");
  const waText = encodeURIComponent(`Hello KhaylimTech! I'd like to order:\n\n${waMsg}\n\nTotal: ${formatNGN(Cart.subtotal())}`);
  assert(waText.includes(encodeURIComponent(testProduct.name)), 'WhatsApp message contains product name');
  assert(waText.includes('Total'), 'WhatsApp message contains total line');

  Cart.remove(testProduct.id);
  assert(Cart.count() === 0, 'Cart.remove() successfully removed item');

  // 5. NAVIGATION LINKS AUDIT
  console.log('\n5. Auditing Clean URLs Across All HTML Pages...');
  const htmlFiles = [
    'index.html',
    'products.html',
    'product-detail.html',
    'cart.html',
    'about.html',
    'contact.html',
    'faq.html',
    'how-to-order.html'
  ];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    // Check for broken links like "index.html" in navigation
    const hasNavIndexHtml = /<nav[^>]*>[\s\S]*?href=["']index\.html["']/i.test(content);
    assert(!hasNavIndexHtml, `${file} does NOT use legacy "index.html" inside <nav>`);
    assert(content.includes('href="/products"'), `${file} contains clean /products link`);
  }

  // 6. DESIGN SYSTEM INCLUSION
  console.log('\n6. Checking professional.css Inclusion on All Pages...');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    const hasProfCss = content.includes('professional.css');
    assert(hasProfCss, `${file} includes professional.css`);
  }

  // 7. LIGHT THEME DEFAULT CHECK
  console.log('\n7. Verifying Light Theme Default Across All HTML Pages...');
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
    assert(content.includes('data-theme="light"'), `${file} has default data-theme="light"`);
    assert(content.includes('class="nav-dropdown"'), `${file} has modern Catalog dropdown in navbar`);
  }

  // 8. APPLE STUDIO HERO & STORE GUARANTEES CHECK
  console.log('\n8. Verifying Apple Studio Hero & Store Guarantees Matrix...');
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  assert(indexHtml.includes('top-utility-bar'), 'index.html has top utility bar');
  assert(indexHtml.includes('Tech You Can Trust'), 'Hero title contains "Tech You Can Trust"');
  assert(indexHtml.includes('assets/luxury_tech_hero.jpg') || indexHtml.includes('assets/apple_hero_showcase.jpg') || indexHtml.includes('assets/khaylimtech-nigerian-hero-v3.png') || indexHtml.includes('assets/khaylim-store-interior-hero.jpg'), 'Hero uses full-bleed Apple hardware showcase photography');
  assert(indexHtml.includes('btn-ghost-gold'), 'Hero features Apple-style ghost gold pill button');
  assert(indexHtml.includes('trust-bar') && indexHtml.includes('trust-card'), 'Store guarantees 4-card matrix is present');

  // 9. APPLE BENTO SHOWCASE & BRAND INTEGRITY CHECK
  console.log('\n9. Verifying Apple Bento Showcase & Brand Integrity...');
  assert(indexHtml.includes('bento-hero-card'), 'index.html has Apple Bento hero card');
  assert(indexHtml.includes('bento-trio-grid'), 'index.html has Apple Bento 3-card trio grid');
  assert(indexHtml.includes('iPhone 15'), 'Bento showcases real iPhone 15 flagship');
  assert(indexHtml.includes('MacBook Air M2'), 'Bento showcases MacBook Air M2');
  assert(indexHtml.includes('PlayStation 5'), 'Bento showcases PlayStation 5');
  assert(indexHtml.includes('AirPods Pro 2'), 'Bento showcases AirPods Pro 2');
  assert(!indexHtml.includes('iPhone 18 Pro'), 'Speculative/fake iPhone 18 Pro teasers are eliminated');
  assert(!indexHtml.includes('gadget-marquee-wrap'), 'Amateur/gimmicky marquee tickers are eliminated');
  assert(indexHtml.includes('customer-stories-section') || indexHtml.includes('customer-stories'), 'index.html has verified customer stories section');
  assert(indexHtml.includes('live-purchase-toast'), 'index.html has live purchase toast widget');

  const profCss = fs.readFileSync(path.join(ROOT, 'css', 'professional.css'), 'utf-8');
  assert(profCss.includes('.bento-hero-card'), 'professional.css styles Apple bento hero card');
  assert(profCss.includes('.bento-trio-grid'), 'professional.css styles Apple bento trio grid');
  assert(profCss.includes('.live-toast'), 'professional.css styles live purchase toast');

  const appJs = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf-8');
  assert(appJs.includes('initLivePurchaseToast'), 'app.js implements initLivePurchaseToast function');

  // SUMMARY
  console.log('\n=============================================');
  console.log(`  Tests Completed: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log('=============================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
