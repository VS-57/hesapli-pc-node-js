import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "pckolik";

// Function to fetch and scrape product data from a given URL
async function fetchAndScrapeProductData(url) {
  const response = await fetch(url);
  const html = await response.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const products = [];
  const productCards = doc.querySelectorAll(".product-card.pc");

  productCards.forEach((card) => {
    const nameElement = card.querySelector(".name");
    const priceElement = card.querySelector(".price-new span");
    const featuresList = card.querySelectorAll("ul li span");
    const imageElement = card.querySelector(".img-crop img");
    const linkElement = card.querySelector(".img-crop");

    const name = nameElement ? nameElement.textContent.trim() : "N/A";
    const priceText = priceElement
      ? priceElement.textContent.trim().replace(/\s+/g, " ")
      : "0";
    const price =
      parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    const image = imageElement
      ? "https://pckolik.com/" + imageElement.getAttribute("src")
      : "N/A";
    const link = linkElement
      ? "https://pckolik.com" + linkElement.getAttribute("href")
      : "N/A";

    // Extract features and organize them into specs
    const features = Array.from(featuresList).map((feature) =>
      feature.textContent.trim()
    );

    const tempCpu =
      features.find(
        (x) =>
          x.toLowerCase().includes("ryzen") ||
          x.toLowerCase().includes("core") ||
          x.toLowerCase().includes("işlemci") ||
          x.toLowerCase().includes("islemci")
      ) || "N/A";

    const tempGpu =
      features.find(
        (x) =>
          x.toLowerCase().includes("rx") ||
          x.toLowerCase().includes("gtx") ||
          x.toLowerCase().includes("rtx") ||
          x.toLowerCase().includes("arc")
      ) || "N/A";

    const specs = {
      CPU: tempCpu,
      Motherboard: features.find((x) =>
        x.toLowerCase().includes("anakart")
      ) || "N/A",
      GPU: tempGpu,
      Ram: features.find((x) => x.toLowerCase().includes("ram")) || "N/A",
      Case: features.find((x) => x.toLowerCase().includes("kasa")) || "N/A",
      Storage: features.find((x) => x.toLowerCase().includes("ssd")) || "N/A",
    };

    products.push({ name, price, image, link, specs, store: "pckolik" });
  });

  return products;
}

// Function to scrape multiple pages
async function scrapeMultiplePages(urls) {
  let allProducts = [];
  for (let url of urls) {
    const products = await fetchAndScrapeProductData(url);
    allProducts = allProducts.concat(products);
  }
  return allProducts;
}

// Express route handler
router.get("/", async (req, res) => {
  const baseUrl = "https://pckolik.com/tr/pc/hazir-sistemler";
  const urls = [`${baseUrl}`];
  try {
    const products = await scrapeMultiplePages(urls);

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'pckolik' store products
    await collection.deleteMany({ store: "pckolik" });

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
