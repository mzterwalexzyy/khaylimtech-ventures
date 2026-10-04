const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 633, height: 800 } });
  await page.goto('http://localhost:5173/phones', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const layout = document.querySelector('.products-layout');
    const main = document.querySelector('.products-main');
    const footer = document.querySelector('.catalog-footer');
    return {
      viewport: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      layoutDisplay: getComputedStyle(layout).display,
      mainWidth: Math.round(main.getBoundingClientRect().width),
      footerWidth: Math.round(footer.getBoundingClientRect().width)
    };
  });
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(150);
  result.navTopAfterScroll = await page.locator('.navbar').evaluate(node =>
    Math.round(node.getBoundingClientRect().top)
  );
  console.log(JSON.stringify(result, null, 2));
  await page.screenshot({ path: 'qa/screenshots/catalog-633.png', fullPage: true, timeout: 30000 });
  await browser.close();

  if (result.bodyWidth > result.viewport + 1 || result.navTopAfterScroll !== 0 || result.mainWidth < result.viewport - 56 ||
      result.footerWidth < result.viewport - 56) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exit(1);
});
