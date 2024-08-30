import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "vatan"; // Collection name set to "vatan"

async function getTotalPages(url) {
  try {
    const response = await fetch(url);
    console.log(`Fetching URL: ${url} - Status: ${response.status}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return 1;
    }

    const html = await response.text();
    console.log(`HTML Content fetched: ${html.length} characters`);
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const paginationItems = doc.querySelectorAll(".pagination__item");
    console.log(`Found ${paginationItems.length} pagination items`);
    if (paginationItems.length < 2) {
      return 1;
    }

    const secondToLastItem = paginationItems[paginationItems.length - 2];
    const totalPages = parseInt(secondToLastItem.textContent.trim(), 10);
    console.log(`Total Pages: ${totalPages}`);

    return totalPages || 1;
  } catch (error) {
    console.error(`Error fetching total pages from ${url}: ${error.message}`);
    return 1;
  }
}

async function fetchAllProducts(urls) {
  const products = [];
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const productElements = doc.querySelectorAll(
        ".product-list.product-list--list-page .product-list-link"
      );

      productElements.forEach((productElement) => {
        const nameElement = productElement.querySelector(
          ".product-list__product-name h3"
        );
        const priceElement = productElement.querySelector(
          ".product-list__price"
        );
        const imageElement = productElement.querySelector(
          ".product-list__image-safe img"
        );

        const link =
          "https://www.vatanbilgisayar.com" +
          productElement.getAttribute("href");
        const name = nameElement ? nameElement.textContent.trim() : "No name";

        // Fiyatı al ve sayıya dönüştür
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

            // Belirli anahtarlar ile eşleştirme yap
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

        products.push({ name, price, image, link, specs, store: "vatan" });
      });
    } catch (error) {
      console.error(
        `Error fetching product list from ${url}: ${error.message}`
      );
    }
  });

  await Promise.all(fetchPromises);
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
    const totalPages = await getTotalPages(baseUrl);
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(urls);

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'vatan' store products
    await collection.deleteMany({ store: "vatan" });

    // Insert new products into MongoDB
    if (products.length > 0) {
      await collection.insertMany(products);
    }

    // Close MongoDB connection
    await client.close();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
