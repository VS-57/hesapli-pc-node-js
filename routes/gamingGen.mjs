import express from "express";
import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";
import path from "path"; // Import path module
import { fileURLToPath } from "url"; // Import fileURLToPath to convert import.meta.url to path

const router = express.Router();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "gamingGen";

async function scrapeProductIDs(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForFunction(
      'typeof window.fiboFiltersData !== "undefined" && window.fiboFiltersData.base_products_ids.length > 0',
      { timeout: 60000 }
    );

    const productIDs = await page.evaluate(() => {
      const fiboFiltersData = window.fiboFiltersData || {};
      return fiboFiltersData.base_products_ids || [];
    });

    return productIDs;
  } catch (error) {
    console.error(`Error in scrapeProductIDs for ${url}:`, error);
    return [];
  }
}

async function scrapeProduct(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    const product = await page.evaluate(() => {
      const titleElement = document.querySelector("h1.product_title");
      const priceElement = document.querySelector("p.price");
      const imageElement = document.querySelector(
        ".woocommerce-product-gallery__image img"
      );
      const descriptionElement = document.querySelector(
        "div.woocommerce-product-details__short-description"
      );
      const descriptionTable = descriptionElement
        ? descriptionElement.querySelector("table tbody")
        : null;

      const name = titleElement ? titleElement.textContent.trim() : "N/A";
      const image = imageElement ? imageElement.src : null;

      let price = "N/A";
      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        const priceParts = priceText.split("Şu andaki fiyat");

        if (priceParts.length > 1) {
          let rawPrice = priceParts[1].trim();
          rawPrice = rawPrice.replace(/[^\d,]/g, "").replace(",", ".");

          let numericPrice = parseFloat(rawPrice);

          if (!isNaN(numericPrice)) {
            if (Number.isInteger(numericPrice)) {
              price = numericPrice;
            } else {
              const [integerPart, decimalPart] = rawPrice.split(".");
              if (decimalPart === "00") {
                price = parseInt(integerPart);
              } else {
                price = numericPrice;
              }
            }
          } else {
            price = 0;
          }
        }
      }

      let description = [];
      if (descriptionTable) {
        const rows = descriptionTable.querySelectorAll("tr");
        description = Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");
          return cells.length >= 2 ? cells[1].innerText : "";
        });
      } else if (descriptionElement) {
        description.push(descriptionElement.textContent.trim());
      }

      let features = description.join(" \\ ").split(" \\ ");

      const tempCpu =
        features.find(
          (x) =>
            x.toLowerCase().includes("ryzen") ||
            x.toLowerCase().includes("core") ||
            x.toLowerCase().includes("İŞLEMCİ".toLowerCase()) ||
            x.toLowerCase().includes("ISLEMCI".toLowerCase())
        ) || "N/A";

      const specs = {
        CPU: tempCpu,
        Motherboard:
          features.find((x) => x.toLowerCase().includes("anakart")) || "N/A",
        GPU:
          features.find((x) => x.toLowerCase().includes("ekran kartı")) ||
          "N/A",
        Ram: features.find((x) => x.toLowerCase().includes("ram")) || "N/A",
        Case: features.find((x) => x.toLowerCase().includes("kasa")) || "N/A",
        Storage: features.find((x) => x.toLowerCase().includes("ssd")) || "N/A",
      };

      return {
        name,
        price,
        specs,
        image,
        store: "gamingGen",
      };
    });

    return { link: url, ...product };
  } catch (error) {
    console.error(`Error in scrapeProduct for ${url}:`, error);
    return null;
  }
}

router.get("/", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = "https://www.gaming.gen.tr/kategori/hazir-sistemler/";

  console.log("Page loaded, starting to scrape product IDs.");

  const productIDs = await scrapeProductIDs(page, url);
  const productURLs = productIDs.map(
    (id) => `https://www.gaming.gen.tr/urun/${id}`
  );

  const results = [];
  for (const productUrl of productURLs) {
    const product = await scrapeProduct(page, productUrl);
    if (product) {
      results.push(product);
    }
  }

  await browser.close();

  // MongoDB'ye kaydetme işlemi
  let client;

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Önceden mevcut olan verileri silmek isterseniz:
    await collection.deleteMany();

    // Yeni verileri ekleyin
    if (results.length > 0) {
      await collection.insertMany(results);
      console.log("Products inserted into MongoDB");
    }
  } catch (error) {
    console.error("Failed to insert products into MongoDB:", error);
  } finally {
    if (client) {
      await client.close();
    }
  }

  console.log("Scraping finished, sending response.");

  res.json(results);
});

export default router;
