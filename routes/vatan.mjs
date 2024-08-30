import express from "express";
import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl = "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "vatan"; // Collection name set to "vatan"

async function getTotalPages(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 0 });

  const totalPages = await page.evaluate(() => {
    const paginationItems = document.querySelectorAll(".pagination__item");
    if (paginationItems.length < 2) {
      return 1;
    }

    const secondToLastItem = paginationItems[paginationItems.length - 2];
    return parseInt(secondToLastItem.textContent.trim(), 10) || 1;
  });

  return totalPages;
}

async function fetchAllProducts(page, urls) {
  const products = [];
  
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'load', timeout: 0 });

    const productsOnPage = await page.evaluate(() => {
      const productElements = document.querySelectorAll(
        ".product-list.product-list--list-page .product-list-link"
      );

      return Array.from(productElements).map(productElement => {
        const nameElement = productElement.querySelector(".product-list__product-name h3");
        const priceElement = productElement.querySelector(".product-list__price");
        const imageElement = productElement.querySelector(".product-list__image-safe img");

        const link =
          "https://www.vatanbilgisayar.com" +
          productElement.getAttribute("href");
        const name = nameElement ? nameElement.textContent.trim() : "No name";

        const priceText = priceElement
          ? priceElement.textContent.trim().replace(/\s+/g, " ")
          : "0";
        const price =
          parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

        const image = imageElement
          ? imageElement.getAttribute("data-src")
          : "No image";
        const specs = {};

        productElement
          .querySelectorAll(".productlist_spec ul li p")
          .forEach((specElement) => {
            const specNameElement = specElement.querySelector("#specname");
            const specValueElement = specElement.querySelector("#specvalue");
            const specName = specNameElement
              ? specNameElement.textContent.trim()
              : "";
            const specValue = specValueElement
              ? specValueElement.textContent.trim()
              : "";

            if (specName.includes("İşlemci Numarası")) {
              specs["CPU"] = specValue;
            } else if (specName.includes("Grafik İşlemci")) {
              specs["GPU"] = specValue;
            } else if (specName.includes("Anakart Chipseti")) {
              specs["Motherboard"] = specValue;
            } else if (specName.includes("Ram (Sistem Belleği)")) {
              specs["Ram"] = specValue;
            }
          });

        return { name, price, image, link, specs, store: "vatan" };
      });
    });

    products.push(...productsOnPage);
  }

  return products;
}

function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? base : `${base}?page=${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.vatanbilgisayar.com/oem-hazir-sistemler/";

  try {
    // Launch Puppeteer with the necessary flags to run as root in Docker
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const totalPages = await getTotalPages(page, baseUrl);
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(page, urls);

    await browser.close();

    // MongoDB connection
    const client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      // Remove existing 'vatan' store products
      await collection.deleteMany({ store: "vatan" });

      // Insert new products into MongoDB
      if (products.length > 0) {
        await collection.insertMany(products);
      }

      res.json(products);
    } catch (dbError) {
      console.error(`Database error: ${dbError.message}`);
      res.status(500).json({ error: `Database error: ${dbError.message}` });
    } finally {
      await client.close();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
