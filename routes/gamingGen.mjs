import express from "express";
import puppeteer from "puppeteer";

const router = express.Router();

async function scrapeProductIDs(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Zaman aşımı süresini 60 saniyeye çıkardık

    await page.waitForFunction(
      'typeof window.fiboFiltersData !== "undefined" && window.fiboFiltersData.base_products_ids.length > 0',
      { timeout: 60000 }
    ); // fiboFiltersData değişkeninin var olup olmadığını kontrol eder ve ürün ID'lerini bekler

    const productIDs = await page.evaluate(() => {
      const fiboFiltersData = window.fiboFiltersData || {};
      return fiboFiltersData.base_products_ids || [];
    });
    console.log(productIDs)
    return productIDs;
  } catch (error) {
    console.error(`Error in scrapeProductIDs for ${url}:`, error);
    return [];
  }
}

router.get("/", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = "https://www.gaming.gen.tr/kategori/hazir-sistemler/";

  console.log("Page loaded, starting to scrape product IDs.");

  const productIDs = await scrapeProductIDs(page, url);
  await browser.close();

  console.log("Scraping finished, sending response.");

  res.json({ productIDs });
});

export default router;
