"""
Doña Ana County Public Records Browser Automation
Run with:
  pip install playwright
  playwright install chromium
  python scripts/donaana_playwright.py
"""

import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    print("🚀 Launching Doña Ana County Scraper (Python Playwright)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        page = await browser.new_page()

        # Step 1: Nav & Search
        await page.goto("https://donaana.nm.publicsearch.us/")
        
        # Populate Dates
        await page.fill('input[placeholder*="Start Date"], #startDate, input[name*="startDate"]', "1/1/1930")
        await page.fill('input[placeholder*="End Date"], #endDate, input[name*="endDate"]', "12/31/1930")
        await page.click('button:has-text("Search")')
        await page.wait_for_load_state("networkidle")

        # Step 2: Row processing
        rows = page.locator("table tbody tr")
        count = await rows.count()
        print(f"Found {count} records.")

        for i in range(count):
            row = rows.nth(i)
            ellipses = row.locator('button[aria-label*="Action"], button:has-text("...")').first
            if await ellipses.is_visible():
                await ellipses.click()
                await page.click('button:has-text("Add to Cart"), [role="menuitem"]:has-text("Add to Cart")')
                
                modal_confirm = page.locator('div[role="dialog"] button:has-text("Add")')
                if await modal_confirm.is_visible(timeout=3000):
                    await modal_confirm.click()

            await asyncio.sleep(0.8)

        # Step 3: Cart Checkout
        await page.click('a[href*="/cart"], a:has-text("Cart")')
        await page.click('button:has-text("Place Your Order")')

        # Step 4: Download
        async with page.expect_download() as download_info:
            await page.click('button:has-text("Download All Documents")')
        download = await download_info.value
        await download.save_as(f"./downloads/{download.suggested_filename}")
        print("✅ Finished!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
