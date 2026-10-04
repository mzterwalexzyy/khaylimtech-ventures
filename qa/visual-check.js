const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const outputDir = path.join(__dirname, 'screenshots');
const routes = [
  ['home', '/'],
  ['products', '/products'],
  ['phone-detail', '/product/ph001'],
  ['cart', '/cart'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['faq', '/faq'],
  ['ordering', '/how-to-order']
];

async function inspectPage(page, name, route, viewportName) {
  console.log(`checking ${name} at ${viewportName}`);
  const errors = [];
  const onConsole = message => {
    const text = message.text();
    const intentionallyBlockedFont = text === 'Failed to load resource: net::ERR_FAILED';
    const externalMapBootstrap = text.includes('google is not defined') && text.includes('maps.gstatic.com');
    if (message.type() === 'error' && !intentionallyBlockedFont && !externalMapBootstrap) errors.push(`console: ${text}`);
  };
  const onPageError = error => errors.push(`page: ${error.message}`);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const layout = await page.evaluate(() => ({
    title: document.title,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    heading: document.querySelector('h1, h2')?.textContent.trim() || '',
    productCards: document.querySelectorAll('.product-card').length,
    stackPanels: document.querySelectorAll('.editorial-stack-panel, .home-stack-panel').length,
    stickyPanels: Array.from(document.querySelectorAll('.editorial-stack-panel, .home-stack-panel'))
      .filter(panel => getComputedStyle(panel).position === 'sticky').length,
    heroBackground: document.querySelector('.editorial-hero')
      ? getComputedStyle(document.querySelector('.editorial-hero')).backgroundImage
      : 'none',
    threeCanvas: Boolean(document.querySelector('#hero-three-canvas'))
  }));

  if (page.viewportSize().width <= 768) {
    const menu = page.locator('.hamburger');
    if (await menu.count()) {
      await menu.click();
      const isOpen = await page.locator('.mobile-nav').evaluate(node => node.classList.contains('open'));
      if (!isOpen) errors.push('interaction: mobile menu did not open');
      await menu.click();
    }
  }

  await page.screenshot({
    path: path.join(outputDir, `${name}-${viewportName}.png`),
    fullPage: ['home', 'products', 'phone-detail', 'cart'].includes(name),
    animations: 'disabled',
    timeout: 15000
  });

  let stackOverlap = null;
  let stackPanelTops = null;
  let threeCanvasPainted = null;
  let threeCanvasMoved = null;
  if (name === 'home' && page.viewportSize().width === 1440) {
    const canvas = page.locator('#hero-three-canvas');
    if (await canvas.count()) {
      const firstFrame = await canvas.evaluate(node => node.toDataURL());
      await page.waitForTimeout(300);
      const secondFrame = await canvas.evaluate(node => node.toDataURL());
      threeCanvasPainted = firstFrame.length > 1500;
      threeCanvasMoved = firstFrame !== secondFrame;
    } else {
      threeCanvasPainted = false;
      threeCanvasMoved = false;
    }
    await page.evaluate(() => {
      const panel = document.querySelectorAll('.editorial-stack-panel, .home-stack-panel')[2];
      if (panel) window.scrollTo(0, panel.offsetTop + 120);
    });
    await page.waitForTimeout(250);
    const panelTops = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.editorial-stack-panel, .home-stack-panel')).slice(0, 3)
        .map(panel => Math.round(panel.getBoundingClientRect().top))
    );
    stackPanelTops = panelTops;
    stackOverlap = panelTops.filter(top => Math.abs(top - 84) <= 2).length >= 2;
    await page.screenshot({
      path: path.join(outputDir, 'home-stacked-desktop.png'),
      animations: 'disabled',
      timeout: 15000
    });
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return {
    name,
    route,
    status: response?.status(),
    ...layout,
    stackOverlap,
    stackPanelTops,
    threeCanvasPainted,
    threeCanvasMoved,
    overflow: layout.bodyWidth > layout.viewportWidth + 1,
    errors
  };
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'small-mobile', width: 360, height: 800 }
  ]) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', route => {
      const request = route.request();
      if (request.resourceType() === 'font' || request.url().includes('fonts.googleapis.com')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    for (const [name, route] of routes) {
      results.push(await inspectPage(page, name, route, viewport.name));
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', route => {
    const request = route.request();
    if (request.resourceType() === 'font' || request.url().includes('fonts.googleapis.com')) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(`${baseURL}/product/ph001`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.locator('#detail-add-btn').click();
  await page.goto(`${baseURL}/cart`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);
  const cartItems = await page.locator('.cart-item').count();
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.theme-toggle').first().click();
  const theme = await page.locator('html').getAttribute('data-theme');
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${baseURL}/products`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await mobilePage.waitForTimeout(1800);
  const filterInitiallyHidden = !(await mobilePage.locator('#catalog-filters').isVisible());
  await mobilePage.locator('.mobile-filter-toggle').click();
  const filterOpened = await mobilePage.locator('#catalog-filters').isVisible();
  const beforeStockFilter = await mobilePage.locator('.product-card').count();
  await mobilePage.locator('#filter-instock').check();
  await mobilePage.waitForTimeout(150);
  const afterStockFilter = await mobilePage.locator('.product-card').count();
  await mobileContext.close();
  await browser.close();

  const report = {
    results,
    interactions: { cartItems, theme, filterInitiallyHidden, filterOpened, beforeStockFilter, afterStockFilter }
  };
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (
    results.some(item => item.status !== 200 || item.overflow || item.errors.length) ||
    results.some(item => item.name === 'home' && item.viewportWidth === 1440 &&
      (item.stackPanels < 5 || item.stickyPanels < 5 || item.heroBackground === 'none' ||
        !item.stackOverlap || !item.threeCanvas || !item.threeCanvasPainted || !item.threeCanvasMoved)) ||
    results.some(item => item.name === 'home' && item.viewportWidth <= 768 && item.stickyPanels !== 0) ||
    cartItems < 1 ||
    theme !== 'dark' ||
    !filterInitiallyHidden ||
    !filterOpened ||
    afterStockFilter >= beforeStockFilter
  ) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
