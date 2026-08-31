/**
 * Standalone Playwright Execution Script for Doña Ana County Public Records portal
 * Run locally with:
 *   npm install playwright
 *   node scripts/donaana_playwright.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  portalUrl: 'https://donaana.nm.publicsearch.us/',
  startDate: process.env.START_DATE || '1/1/1930',
  endDate: process.env.END_DATE || '12/31/1930',
  headless: process.env.HEADLESS === 'true' || false,
  throttleMs: parseInt(process.env.THROTTLE_MS || '800', 10),
  outputDir: path.join(__dirname, '../downloads'),
  manifestPath: path.join(__dirname, '../downloads/dona_ana_manifest.json'),
};

const SELECTORS = {
  indexTab: ['button[role="tab"]:has-text("Index Only")', 'button:has-text("Index Only")', '#tab-index-only'],
  startDate: ['input[name*="startDate" i]', 'input[aria-label*="Start Date" i]', '#startDate'],
  endDate: ['input[name*="endDate" i]', 'input[aria-label*="End Date" i]', '#endDate'],
  searchBtn: ['button[type="submit"]:has-text("Search")', 'button:has-text("Search")'],
  rows: ['table.results-table tbody tr', 'table tbody tr', 'div[role="row"].search-result-row'],
  ellipses: ['button[aria-label*="Action" i]', 'button:has-text("...")', 'td:last-child button'],
  addToCart: ['[role="menuitem"]:has-text("Add to Cart")', 'button:has-text("Add to Cart")'],
  modal: ['div[role="dialog"]', '.modal.show'],
  modalAdd: ['div[role="dialog"] button:has-text("Add")', '.modal button:has-text("Add")'],
  nextPage: ['button[aria-label="Next page" i]:not([disabled])', 'button:has-text("Next"):not([disabled])'],
  cartLink: ['a[href*="/cart" i]', 'a:has-text("Cart")', 'button:has-text("Cart")'],
  placeOrder: ['button:has-text("Place Your Order")', 'button:has-text("Place Order")'],
  downloadAll: ['button:has-text("Download All Documents")', 'a:has-text("Download All Documents")'],
};

async function findFirst(pageOrEl, selectors, timeout = 3000) {
  for (const sel of selectors) {
    try {
      const loc = pageOrEl.locator(sel).first();
      if (await loc.isVisible({ timeout })) return loc;
    } catch {}
  }
  return null;
}

async function run() {
  console.log('🚀 Starting Doña Ana County Browser Automation...');
  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: CONFIG.headless, slowMo: 150 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Navigation & Search
    console.log(`[1/5] Navigating to ${CONFIG.portalUrl}...`);
    await page.goto(CONFIG.portalUrl, { waitUntil: 'domcontentloaded' });

    const tab = await findFirst(page, SELECTORS.indexTab);
    if (tab) await tab.click();

    const startInput = await findFirst(page, SELECTORS.startDate);
    if (startInput) await startInput.fill(CONFIG.startDate);

    const endInput = await findFirst(page, SELECTORS.endDate);
    if (endInput) await endInput.fill(CONFIG.endDate);

    const searchBtn = await findFirst(page, SELECTORS.searchBtn);
    if (searchBtn) await searchBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    console.log('✅ Search results loaded.');

    // 2. Row Processing Loop
    let pageNum = 1;
    let totalCart = 0;
    const records = [];

    while (true) {
      console.log(`\n--- Processing Page ${pageNum} ---`);
      const rows = page.locator(SELECTORS.rows[0]);
      let count = await rows.count();
      if (count === 0 && SELECTORS.rows[1]) {
        count = await page.locator(SELECTORS.rows[1]).count();
      }

      console.log(`Found ${count} records.`);
      if (count === 0) break;

      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        await row.scrollIntoViewIfNeeded();

        const btn = await findFirst(row, SELECTORS.ellipses);
        if (btn) await btn.click();

        await page.waitForTimeout(200);
        const addCart = await findFirst(page, SELECTORS.addToCart);
        if (addCart) await addCart.click();

        const modal = await findFirst(page, SELECTORS.modal, 3000);
        if (modal) {
          const confirmBtn = await findFirst(page, SELECTORS.modalAdd);
          if (confirmBtn) await confirmBtn.click();
          await modal.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
        }

        totalCart++;
        console.log(`  [Row ${i + 1}] Added to cart (Cart Total: ${totalCart})`);
        await page.waitForTimeout(CONFIG.throttleMs);
      }

      const nextBtn = await findFirst(page, SELECTORS.nextPage);
      if (nextBtn && (await nextBtn.isEnabled())) {
        console.log('Navigating to next page...');
        await nextBtn.click();
        await page.waitForLoadState('domcontentloaded');
        pageNum++;
      } else {
        break;
      }
    }

    // 3. Cart & Order Checkout
    console.log('\n[3/5] Navigating to Cart...');
    const cart = await findFirst(page, SELECTORS.cartLink);
    if (cart) await cart.click();

    const orderBtn = await findFirst(page, SELECTORS.placeOrder, 8000);
    if (orderBtn) {
      await orderBtn.click();
      console.log('✅ Order placed.');
    }

    // 4. Download
    console.log('[4/5] Intercepting Document Download...');
    const downloadBtn = await findFirst(page, SELECTORS.downloadAll, 10000);
    if (downloadBtn) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        downloadBtn.click(),
      ]);
      const target = path.join(CONFIG.outputDir, download.suggestedFilename());
      await download.saveAs(target);
      console.log(`✅ Downloaded package to: ${target}`);
    }

    console.log('\n🎉 Automation completed successfully!');
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
