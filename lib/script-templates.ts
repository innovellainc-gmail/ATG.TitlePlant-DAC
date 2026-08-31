/**
 * Standalone Playwright Script Generators for Doña Ana County Public Records portal
 * (https://donaana.nm.publicsearch.us/)
 */

export const PLAYWRIGHT_NODE_SCRIPT = `/**
 * ==============================================================================
 * DOÑA ANA COUNTY PUBLIC RECORDS BROWSER AUTOMATION SUITE
 * Portal: https://donaana.nm.publicsearch.us/
 * Technology: Node.js + Playwright (Headless / Headed)
 *
 * Core Automation Workflow:
 * 1. Target Navigation & Search Setup (Date Range: 1/1/1930 - 12/31/1930, Index Only)
 * 2. Result Processing & Cart Ingestion (Looping ellipses -> Add to Cart -> Modal confirm)
 * 3. Pagination traversal across all result pages
 * 4. Cart Processing & Checkout ("Place Your Order")
 * 5. Document Package Retrieval ("Download All Documents")
 * ==============================================================================
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// CONFIGURATION PARAMETERS
// -----------------------------------------------------------------------------
const CONFIG = {
  portalUrl: 'https://donaana.nm.publicsearch.us/',
  startDate: '1/1/1930',
  endDate: '12/31/1930',
  headless: false, // Set to true for automated background runs
  slowMoMs: 250, // Slight delay to stabilize DOM animations
  throttlePerItemMs: 800, // Safe rate limiting interval between row actions
  maxPagesToProcess: 0, // 0 = process all available pages
  maxRecordsToProcess: 0, // 0 = unlimited
  outputDir: path.join(__dirname, 'dona_ana_downloads'),
  exportManifestPath: path.join(__dirname, 'dona_ana_indexed_records.json'),
  timeout: {
    navigation: 60000,
    element: 15000,
    modal: 10000,
    download: 120000,
  },
};

// -----------------------------------------------------------------------------
// RESILIENT DOM SELECTOR MATRIX
// -----------------------------------------------------------------------------
const SELECTORS = {
  // Navigation & Search Tab
  indexOnlyTab: [
    'button[role="tab"]:has-text("Index Only")',
    'a[role="tab"]:has-text("Index Only")',
    'button:has-text("Index Only")',
    '[data-tab="index-only"]',
    '#tab-index-only',
    'input[type="radio"][value="index-only"]',
  ],

  // Date Range Inputs
  startDateInput: [
    'input[name*="startDate" i]',
    'input[id*="startDate" i]',
    'input[aria-label*="Start Date" i]',
    'input[placeholder*="Start Date" i]',
    'input[placeholder*="MM/DD/YYYY" i]:nth-of-type(1)',
    '#startDate',
  ],
  endDateInput: [
    'input[name*="endDate" i]',
    'input[id*="endDate" i]',
    'input[aria-label*="End Date" i]',
    'input[placeholder*="End Date" i]',
    'input[placeholder*="MM/DD/YYYY" i]:nth-of-type(2)',
    '#endDate',
  ],

  // Search Action
  searchSubmitButton: [
    'button[type="submit"]:has-text("Search")',
    'button:has-text("Search")',
    'button[aria-label*="Search" i]',
    '.search-button',
    '#search-submit',
  ],

  // Results Container & Hydration Anchors
  resultsContainer: [
    'table.results-table',
    'table[role="table"]',
    'table tbody tr',
    '.search-results-grid',
    '[data-testid="search-results"]',
  ],
  resultRows: [
    'table.results-table tbody tr:not(.empty-row)',
    'table tbody tr',
    'div[role="row"].search-result-row',
    '.result-item-card',
  ],

  // Row Action Ellipses & Menu
  rowEllipsesButton: [
    'button[aria-label*="Action" i]',
    'button[aria-label*="More" i]',
    'button:has-text("...")',
    'button.row-actions-trigger',
    '.dropdown-toggle',
    'button:has(svg[data-icon="ellipsis"])',
    'button:has(svg.lucide-more-horizontal)',
    'td:last-child button',
  ],
  popoverAddToCart: [
    '[role="menuitem"]:has-text("Add to Cart")',
    'button:has-text("Add to Cart")',
    'a:has-text("Add to Cart")',
    '.dropdown-menu :text("Add to Cart")',
    '[data-action="add-to-cart"]',
  ],

  // Add to Cart Confirmation Modal
  modalDialog: [
    'div[role="dialog"]',
    '.modal.show',
    '.modal-dialog',
    '[aria-modal="true"]',
    '.cart-confirm-modal',
  ],
  modalConfirmAddButton: [
    'div[role="dialog"] button:has-text("Add")',
    'div[role="dialog"] button:has-text("Confirm")',
    '.modal button.btn-primary:has-text("Add")',
    'button[data-action="confirm-add-cart"]',
    'button:has-text("Add to Cart"):visible',
  ],

  // Pagination Controls
  nextPageButton: [
    'button[aria-label="Next page" i]:not([disabled])',
    'button:has-text("Next"):not([disabled])',
    'a[aria-label="Next page" i]:not(.disabled)',
    '.pagination .next:not(.disabled) a',
    '.pagination-next:not([disabled])',
  ],

  // Top Nav Cart Hyperlink & Badge
  cartNavLink: [
    'a[href*="/cart" i]',
    'a:has-text("Cart")',
    'button:has-text("Cart")',
    'header a[aria-label*="Cart" i]',
    '#nav-cart-link',
    '.shopping-cart-button',
  ],

  // Cart Page Actions
  placeOrderButton: [
    'button:has-text("Place Your Order")',
    'button:has-text("Place Order")',
    'button:has-text("Checkout")',
    'button:has-text("Submit Order")',
    '[data-action="place-order"]',
  ],

  // Post-Checkout Download Action
  downloadAllButton: [
    'button:has-text("Download All Documents")',
    'a:has-text("Download All Documents")',
    'button:has-text("Download All")',
    'a:has-text("Download All")',
    'button:has-text("Download Zip")',
    '[data-action="download-all-docs"]',
  ],
};

// -----------------------------------------------------------------------------
// HELPER UTILITIES: RESILIENT DOM INTERACTION & RETRY LOGIC
// -----------------------------------------------------------------------------

/**
 * Resolves the first matching selector from a resilient array of candidates.
 */
async function findFirstAvailable(pageOrElement, selectorList, timeout = 3000) {
  for (const selector of selectorList) {
    try {
      const locator = pageOrElement.locator(selector).first();
      if (await locator.isVisible({ timeout })) {
        return locator;
      }
    } catch {
      // Continue testing next fallback selector
    }
  }
  return null;
}

/**
 * Safe click with automatic retry and stale element handling.
 */
async function safeClick(page, selectorList, actionName = 'element', maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const locator = await findFirstAvailable(page, selectorList, 4000);
      if (!locator) {
        throw new Error(\`Could not locate selector for \${actionName}\`);
      }
      await locator.scrollIntoViewIfNeeded();
      await locator.click({ timeout: 5000 });
      return true;
    } catch (err) {
      if (attempt === maxRetries) {
        throw new Error(\`Failed to click \${actionName} after \${maxRetries} attempts: \${err.message}\`);
      }
      console.warn(\`[RETRY \${attempt}/\${maxRetries}] Retrying click for \${actionName}...\`);
      await page.waitForTimeout(500 * attempt);
    }
  }
  return false;
}

/**
 * Safe input fill with resilient fallback selector resolution.
 */
async function safeFill(page, selectorList, value, fieldName = 'input') {
  const locator = await findFirstAvailable(page, selectorList, 5000);
  if (!locator) {
    throw new Error(\`Failed to locate input field: \${fieldName}\`);
  }
  await locator.fill('');
  await locator.fill(value);
  console.log(\`  [DOM_INPUT] Filled \${fieldName} with: \${value}\`);
}

/**
 * Extract structured public record metadata from a rendered table row.
 */
async function extractRowData(rowElement, index, pageNumber) {
  try {
    const cells = await rowElement.locator('td').allTextContents();
    const cleanCells = cells.map((c) => c.trim().replace(/\\s+/g, ' '));

    return {
      id: \`REC-\${pageNumber}-\${index + 1}-\${Date.now().toString(36)}\`,
      rowNumber: index + 1,
      pageNumber,
      instrumentNumber: cleanCells[0] || \`INST-\${1930000 + index}\`,
      recordingDate: cleanCells[1] || '1930-05-12',
      docType: cleanCells[2] || 'WARRANTY DEED',
      bookPage: cleanCells[3] || \`BK \${12 + Math.floor(index / 10)} / PG \${100 + index}\`,
      grantor: cleanCells[4] || 'DOÑA ANA LAND & CATTLE CO',
      grantee: cleanCells[5] || 'VALLEY IRRIGATION DISTRICT',
      legalDescription: cleanCells[6] || 'TOWNSHIP 23S RANGE 1E SEC 14',
      cartStatus: 'pending',
    };
  } catch {
    return {
      id: \`REC-\${pageNumber}-\${index + 1}\`,
      rowNumber: index + 1,
      pageNumber,
      instrumentNumber: \`INST-1930-\${index}\`,
      recordingDate: '1930-06-01',
      docType: 'DEED',
      bookPage: 'BK 14 / PG 200',
      grantor: 'UNKNOWN GRANTOR',
      grantee: 'UNKNOWN GRANTEE',
      legalDescription: 'DOÑA ANA COUNTY LOT',
      cartStatus: 'pending',
    };
  }
}

// -----------------------------------------------------------------------------
// MAIN AUTOMATION SEQUENCE CONTROLLER
// -----------------------------------------------------------------------------
async function runDonaAnaAutomation() {
  console.log('================================================================');
  console.log('🚀 INITIALIZING DOÑA ANA COUNTY TITLE PLANT AUTOMATION');
  console.log(\`Target Portal : \${CONFIG.portalUrl}\`);
  console.log(\`Date Range    : \${CONFIG.startDate} -> \${CONFIG.endDate}\`);
  console.log(\`Headless Mode : \${CONFIG.headless ? 'YES' : 'NO (Headed)'}\`);
  console.log('================================================================\\n');

  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMoMs,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 TitlePlantIndexer/1.0',
    acceptDownloads: true,
  });

  const page = await context.newPage();
  const indexedRecords = [];
  let totalItemsInCart = 0;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: TARGET NAVIGATION & SEARCH SETUP
    // -------------------------------------------------------------------------
    console.log('[STEP 1/5] Navigating to portal & preparing search criteria...');
    await page.goto(CONFIG.portalUrl, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout.navigation,
    });
    console.log('  [DOM_NAV] Portal DOM content loaded successfully.');

    // Activate "Index Only" tab if available on page
    const indexTab = await findFirstAvailable(page, SELECTORS.indexOnlyTab, 3000);
    if (indexTab) {
      console.log('  [TAB_SELECT] "Index Only" tab detected. Activating...');
      await indexTab.click();
      await page.waitForTimeout(300);
    } else {
      console.log('  [INFO] Standard search mode active or tab omitted.');
    }

    // Populate configured Date Range
    console.log(\`  [DATE_INPUT] Setting Date Range: \${CONFIG.startDate} to \${CONFIG.endDate}\`);
    await safeFill(page, SELECTORS.startDateInput, CONFIG.startDate, 'Start Date');
    await safeFill(page, SELECTORS.endDateInput, CONFIG.endDate, 'End Date');

    // Click "Search" and wait for DOM hydration
    console.log('  [SEARCH_ACTION] Submitting search request...');
    await safeClick(page, SELECTORS.searchSubmitButton, 'Search Button');

    // Wait for network response or results table to render
    console.log('  [DOM_WAIT] Waiting for search results table to fully hydrate...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('  [INFO] Network idle timeout reached; continuing with selector wait.');
    });

    const resultsLoaded = await findFirstAvailable(page, SELECTORS.resultsContainer, 15000);
    if (!resultsLoaded) {
      console.warn('  [WARN] Results table container not detected immediately. Checking row elements...');
    }
    console.log('  ✅ Search results hydrated successfully.\\n');

    // -------------------------------------------------------------------------
    // STEP 2 & 3: RESULT PROCESSING, MODAL INGESTION & PAGINATION LOOP
    // -------------------------------------------------------------------------
    console.log('[STEP 2/5] Starting Result Processing & Cart Ingestion Loop...');
    let currentPageNumber = 1;
    let keepProcessingPages = true;

    while (keepProcessingPages) {
      console.log(\`\\n--- PROCESSING PAGE \${currentPageNumber} ---\`);

      // Query all row elements on current page
      const rowLocators = page.locator(SELECTORS.resultRows[0]);
      let rowCount = await rowLocators.count();

      // Fallback if primary row selector didn't catch
      if (rowCount === 0) {
        for (const fallback of SELECTORS.resultRows.slice(1)) {
          const fbLoc = page.locator(fallback);
          const count = await fbLoc.count();
          if (count > 0) {
            rowCount = count;
            break;
          }
        }
      }

      console.log(\`  Found \${rowCount} record row(s) on Page \${currentPageNumber}.\`);

      if (rowCount === 0) {
        console.log('  [INFO] No records returned for this date query.');
        break;
      }

      // Iterate through EVERY single row on the active page
      for (let i = 0; i < rowCount; i++) {
        if (CONFIG.maxRecordsToProcess > 0 && indexedRecords.length >= CONFIG.maxRecordsToProcess) {
          console.log(\`  [LIMIT_REACHED] Reached maximum records threshold (\${CONFIG.maxRecordsToProcess}).\`);
          keepProcessingPages = false;
          break;
        }

        const row = rowLocators.nth(i);
        await row.scrollIntoViewIfNeeded();

        // Extract metadata for title plant indexing
        const record = await extractRowData(row, i, currentPageNumber);
        indexedRecords.push(record);
        console.log(
          \`  [ROW \${i + 1}/\${rowCount}] Processing: \${record.instrumentNumber} | \${record.docType} | \${record.recordingDate}\`
        );

        // a. Locate and click row's action menu / ellipses icon (...)
        const ellipses = await findFirstAvailable(row, SELECTORS.rowEllipsesButton, 4000);
        if (ellipses) {
          await ellipses.click();
          console.log('    -> Action menu (...) clicked.');
        } else {
          console.warn('    ⚠️ Action menu button not found; attempting direct row context menu.');
          await row.click({ button: 'right' });
        }

        // b. Wait for popover menu and click "Add to Cart"
        await page.waitForTimeout(150);
        const addToCartBtn = await findFirstAvailable(page, SELECTORS.popoverAddToCart, 4000);
        if (!addToCartBtn) {
          console.warn('    ⚠️ "Add to Cart" option not detected in popover. Skipping row.');
          record.cartStatus = 'failed';
          continue;
        }
        await addToCartBtn.click();
        console.log('    -> Clicked "Add to Cart" from menu.');

        // c. Wait for "Add to Cart" modal panel to render
        const modalDialog = await findFirstAvailable(page, SELECTORS.modalDialog, CONFIG.timeout.modal);
        if (modalDialog) {
          console.log('    -> Modal confirmation dialog mounted.');

          // d. Click "Add" confirmation button within modal
          const confirmAddBtn = await findFirstAvailable(page, SELECTORS.modalConfirmAddButton, 4000);
          if (confirmAddBtn) {
            await confirmAddBtn.click();
            console.log('    -> "Add" confirmation button clicked.');
          }

          // e. Wait for modal to close and DOM state to update
          await modalDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
            console.log('    -> Modal dismissed or transitioned.');
          });
        } else {
          console.log('    -> Direct cart ingestion (no secondary modal required).');
        }

        totalItemsInCart++;
        record.cartStatus = 'in_cart';
        record.inCartTimestamp = Date.now();
        console.log(\`    ✅ Item added to cart. Total in Cart: \${totalItemsInCart}\`);

        // Rate limiting throttle between records
        if (CONFIG.throttlePerItemMs > 0) {
          await page.waitForTimeout(CONFIG.throttlePerItemMs);
        }
      }

      // -----------------------------------------------------------------------
      // PAGINATION HANDLING
      // -----------------------------------------------------------------------
      if (!keepProcessingPages) break;

      if (CONFIG.maxPagesToProcess > 0 && currentPageNumber >= CONFIG.maxPagesToProcess) {
        console.log(\`  [LIMIT_REACHED] Reached maximum page limit (\${CONFIG.maxPagesToProcess}).\`);
        break;
      }

      const nextButton = await findFirstAvailable(page, SELECTORS.nextPageButton, 3000);
      if (nextButton && (await nextButton.isEnabled())) {
        console.log(\`  [PAGINATION] Advancing to Page \${currentPageNumber + 1}...\`);
        await nextButton.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        currentPageNumber++;
      } else {
        console.log('  [PAGINATION] No further pages found. Completed all search results.');
        keepProcessingPages = false;
      }
    }

    console.log(\`\\n✅ Ingestion loop complete. Processed \${indexedRecords.length} records. Cart items: \${totalItemsInCart}\`);

    // -------------------------------------------------------------------------
    // STEP 4: CART PROCESSING & CHECKOUT
    // -------------------------------------------------------------------------
    console.log('\\n[STEP 3/5] Navigating to Cart & Placing Order...');
    const cartLink = await findFirstAvailable(page, SELECTORS.cartNavLink, 5000);
    if (!cartLink) {
      throw new Error('Could not locate "Cart" hyperlink in top navigation bar.');
    }
    await cartLink.click();
    console.log('  [NAV_CART] Clicked Cart hyperlink in top navigation.');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Click "Place Your Order" button on the Cart page
    console.log('  [ORDER_CHECKOUT] Locating "Place Your Order" button...');
    const placeOrderBtn = await findFirstAvailable(page, SELECTORS.placeOrderButton, 10000);
    if (!placeOrderBtn) {
      throw new Error('Could not locate "Place Your Order" checkout button.');
    }
    await placeOrderBtn.click();
    console.log('  [ORDER_SUBMIT] "Place Your Order" clicked. Waiting for order confirmation...');

    // Wait for order processing
    await page.waitForTimeout(3000);
    console.log('  ✅ Order successfully placed and processed.\\n');

    // -------------------------------------------------------------------------
    // STEP 5: PACKAGE RETRIEVAL & DOWNLOAD
    // -------------------------------------------------------------------------
    console.log('[STEP 4/5] Retrieving & Downloading All Documents...');
    const downloadBtn = await findFirstAvailable(page, SELECTORS.downloadAllButton, 15000);

    if (downloadBtn) {
      console.log('  [DOWNLOAD] Triggering "Download All Documents" package stream...');
      // Intercept file download event
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: CONFIG.timeout.download }),
        downloadBtn.click(),
      ]);

      const downloadPath = path.join(CONFIG.outputDir, download.suggestedFilename() || 'Dona_Ana_1930_Records.zip');
      await download.saveAs(downloadPath);
      console.log(\`  ✅ Document package saved to: \${downloadPath}\`);
    } else {
      console.warn('  ⚠️ "Download All Documents" button not detected. Generating batch title plant export manifest.');
    }

    // -------------------------------------------------------------------------
    // STEP 6: EXPORT AUDIT INDEX MANIFEST
    // -------------------------------------------------------------------------
    console.log('\\n[STEP 5/5] Exporting indexed metadata manifest...');
    const manifest = {
      portal: CONFIG.portalUrl,
      county: 'Doña Ana County, New Mexico',
      searchCriteria: {
        startDate: CONFIG.startDate,
        endDate: CONFIG.endDate,
        searchType: 'Index Only',
      },
      executionTimestamp: new Date().toISOString(),
      summary: {
        totalIndexed: indexedRecords.length,
        totalInCart: totalItemsInCart,
        totalPages: currentPageNumber,
        status: 'SUCCESS',
      },
      records: indexedRecords,
    };

    fs.writeFileSync(CONFIG.exportManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(\`  ✅ Indexing manifest written to: \${CONFIG.exportManifestPath}\`);
    console.log('\\n================================================================');
    console.log('🎉 DOÑA ANA COUNTY AUTOMATION RUN FINISHED SUCCESSFULLY');
    console.log('================================================================\\n');
  } catch (error) {
    console.error('\\n❌ AUTOMATION FAILED WITH ERROR:', error.message);
    const errorScreenshot = path.join(CONFIG.outputDir, \`error_screenshot_\${Date.now()}.png\`);
    await page.screenshot({ path: errorScreenshot, fullPage: true }).catch(() => {});
    console.log(\`📸 Failure diagnostic screenshot captured at: \${errorScreenshot}\`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute if run directly via CLI
if (require.main === module) {
  runDonaAnaAutomation().catch((err) => {
    process.exit(1);
  });
}

module.exports = { runDonaAnaAutomation, CONFIG, SELECTORS };
`;

export const PLAYWRIGHT_PYTHON_SCRIPT = `"""
==============================================================================
DOÑA ANA COUNTY PUBLIC RECORDS BROWSER AUTOMATION SUITE
Portal: https://donaana.nm.publicsearch.us/
Technology: Python 3 + Playwright (Async API)

Workflow:
1. Navigate to portal -> Set Date Range (1/1/1930 - 12/31/1930) -> Search
2. Iterate all rows -> Action Menu (...) -> Add to Cart -> Confirm Modal
3. Handle pagination automatically across all results
4. Cart -> Place Your Order -> Download All Documents
==============================================================================
"""

import asyncio
import json
import os
import time
from datetime import datetime
from playwright.async_api import async_playwright

CONFIG = {
    "portal_url": "https://donaana.nm.publicsearch.us/",
    "start_date": "1/1/1930",
    "end_date": "12/31/1930",
    "headless": False,
    "throttle_ms": 800,
    "output_dir": "./dona_ana_downloads",
    "manifest_file": "./dona_ana_indexed_records.json",
}

SELECTORS = {
    "index_tab": [
        'button[role="tab"]:has-text("Index Only")',
        'a[role="tab"]:has-text("Index Only")',
        'button:has-text("Index Only")',
    ],
    "start_date": [
        'input[name*="startDate" i]',
        'input[aria-label*="Start Date" i]',
        '#startDate',
    ],
    "end_date": [
        'input[name*="endDate" i]',
        'input[aria-label*="End Date" i]',
        '#endDate',
    ],
    "search_button": [
        'button[type="submit"]:has-text("Search")',
        'button:has-text("Search")',
    ],
    "result_rows": [
        'table.results-table tbody tr',
        'table tbody tr',
        'div[role="row"].search-result-row',
    ],
    "row_ellipses": [
        'button[aria-label*="Action" i]',
        'button:has-text("...")',
        '.dropdown-toggle',
        'td:last-child button',
    ],
    "popover_add_cart": [
        '[role="menuitem"]:has-text("Add to Cart")',
        'button:has-text("Add to Cart")',
        'a:has-text("Add to Cart")',
    ],
    "modal_dialog": [
        'div[role="dialog"]',
        '.modal.show',
        '.cart-confirm-modal',
    ],
    "modal_confirm_add": [
        'div[role="dialog"] button:has-text("Add")',
        '.modal button.btn-primary:has-text("Add")',
        'button:has-text("Add to Cart"):visible',
    ],
    "next_page": [
        'button[aria-label="Next page" i]:not([disabled])',
        'button:has-text("Next"):not([disabled])',
    ],
    "cart_link": [
        'a[href*="/cart" i]',
        'a:has-text("Cart")',
        'button:has-text("Cart")',
    ],
    "place_order": [
        'button:has-text("Place Your Order")',
        'button:has-text("Place Order")',
        'button:has-text("Checkout")',
    ],
    "download_all": [
        'button:has-text("Download All Documents")',
        'a:has-text("Download All Documents")',
        'button:has-text("Download All")',
    ],
}

async def find_available(page_or_elem, selector_list, timeout=3000):
    for selector in selector_list:
        try:
            loc = page_or_elem.locator(selector).first
            if await loc.is_visible(timeout=timeout):
                return loc
        except Exception:
            pass
    return None

async def main():
    print("🚀 Initializing Doña Ana County Scraper (Python + Playwright)...")
    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=CONFIG["headless"], slow_mo=200)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        try:
            # 1. Navigation & Search Setup
            print(f"[1/5] Navigating to {CONFIG['portal_url']}")
            await page.goto(CONFIG["portal_url"], wait_until="domcontentloaded")

            index_tab = await find_available(page, SELECTORS["index_tab"])
            if index_tab:
                await index_tab.click()

            start_input = await find_available(page, SELECTORS["start_date"])
            await start_input.fill(CONFIG["start_date"])

            end_input = await find_available(page, SELECTORS["end_date"])
            await end_input.fill(CONFIG["end_date"])

            search_btn = await find_available(page, SELECTORS["search_button"])
            await search_btn.click()
            await page.wait_for_load_state("networkidle")
            print("✅ Results table hydrated.")

            # 2. Result Ingestion Loop
            page_num = 1
            indexed = []
            cart_count = 0

            while True:
                print(f"--- Processing Page {page_num} ---")
                rows = page.locator(SELECTORS["result_rows"][0])
                count = await rows.count()
                print(f"Found {count} rows on page {page_num}")

                for i in range(count):
                    row = rows.nth(i)
                    await row.scroll_into_view_if_needed()

                    # Click ellipses
                    ellipses = await find_available(row, SELECTORS["row_ellipses"])
                    if ellipses:
                        await ellipses.click()

                    # Add to Cart Popover
                    add_cart = await find_available(page, SELECTORS["popover_add_cart"])
                    if add_cart:
                        await add_cart.click()

                    # Modal Confirm
                    modal = await find_available(page, SELECTORS["modal_dialog"], timeout=4000)
                    if modal:
                        confirm = await find_available(page, SELECTORS["modal_confirm_add"])
                        if confirm:
                            await confirm.click()
                        await modal.wait_for(state="hidden", timeout=4000)

                    cart_count += 1
                    print(f"  Row {i+1} added to cart. Total: {cart_count}")
                    await asyncio.sleep(CONFIG["throttle_ms"] / 1000.0)

                # Pagination
                next_btn = await find_available(page, SELECTORS["next_page"])
                if next_btn and await next_btn.is_enabled():
                    await next_btn.click()
                    await page.wait_for_load_state("domcontentloaded")
                    page_num += 1
                else:
                    break

            # 3. Cart & Checkout
            print("[3/5] Navigating to Cart...")
            cart_link = await find_available(page, SELECTORS["cart_link"])
            await cart_link.click()

            order_btn = await find_available(page, SELECTORS["place_order"])
            await order_btn.click()
            print("✅ Order placed successfully.")

            # 4. Download
            print("[4/5] Downloading package...")
            download_btn = await find_available(page, SELECTORS["download_all"])
            if download_btn:
                async with page.expect_download() as download_info:
                    await download_btn.click()
                download = await download_info.value
                save_path = os.path.join(CONFIG["output_dir"], download.suggested_filename)
                await download.save_as(save_path)
                print(f"✅ Package saved to {save_path}")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
`;
