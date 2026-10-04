const { chromium } = require('playwright');

const baseURL = process.env.BASE_URL || 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(baseURL) || url.startsWith('data:')) return route.continue();
    return route.abort();
  });
  const errors = [];
  page.on('pageerror', error => {
    if (!error.message.includes('firebase is not defined')) errors.push(error.message);
  });

  const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);

  const canvas = page.locator('#hero-three-canvas');
  const canvasCount = await canvas.count();
  const firstFrame = canvasCount ? await canvas.evaluate(node => node.toDataURL()) : '';
  const firstFrameNumber = canvasCount ? Number(await canvas.getAttribute('data-frame')) : 0;
  await page.waitForTimeout(350);
  const secondFrame = canvasCount ? await canvas.evaluate(node => node.toDataURL()) : '';
  const secondFrameNumber = canvasCount ? Number(await canvas.getAttribute('data-frame')) : 0;
  const sceneType = canvasCount ? await canvas.getAttribute('data-scene') : null;

  const panels = page.locator('.editorial-stack-panel, .home-stack-panel');
  const panelCount = await panels.count();
  const stickyCount = await panels.evaluateAll(nodes =>
    nodes.filter(node => getComputedStyle(node).position === 'sticky').length
  );

  await page.screenshot({ path: 'qa/screenshots/home-phone-hero.png', timeout: 30000 });

  await panels.nth(2).evaluate(node => window.scrollTo(0, node.offsetTop + 80));
  await page.waitForTimeout(300);
  const panelTops = await panels.evaluateAll(nodes =>
    nodes.slice(0, 3).map(node => Math.round(node.getBoundingClientRect().top))
  );
  await page.screenshot({ path: 'qa/screenshots/home-current-stack.png', timeout: 30000 });
  const desktopOverflow = await page.evaluate(() => document.body.scrollWidth > document.documentElement.clientWidth + 1);

  const mobilePage = page;
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await mobilePage.waitForTimeout(500);
  const mobileCanvas = mobilePage.locator('#hero-three-canvas');
  const mobileResult = {
    canvas: await mobileCanvas.count(),
    painted: (await mobileCanvas.evaluate(node => node.toDataURL())).length > 1500,
    overflow: await mobilePage.evaluate(() => document.body.scrollWidth > document.documentElement.clientWidth + 1),
    stickyPanels: await mobilePage.locator('.editorial-stack-panel, .home-stack-panel').evaluateAll(nodes =>
      nodes.filter(node => getComputedStyle(node).position === 'sticky').length
    )
  };
  await mobilePage.screenshot({ path: 'qa/screenshots/home-phone-mobile.png', timeout: 30000 });

  const result = {
    status: response && response.status(),
    canvasCount,
    canvasPainted: firstFrame.length > 1500,
    canvasMoved: firstFrame !== secondFrame || secondFrameNumber > firstFrameNumber,
    sceneType,
    panelCount,
    stickyCount,
    panelTops,
    minimumPanelHeight: await panels.first().evaluate(node => Math.round(node.getBoundingClientRect().height)),
    overflow: desktopOverflow,
    mobile: mobileResult,
    errors
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();

  if (result.status !== 200 || !result.canvasCount || !result.canvasPainted || !result.canvasMoved ||
      result.sceneType !== 'phone' || result.minimumPanelHeight < 910 ||
      result.panelCount < 10 || result.stickyCount < 10 || result.overflow || result.errors.length ||
      !result.mobile.canvas || !result.mobile.painted || result.mobile.overflow || result.mobile.stickyPanels !== 0) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
