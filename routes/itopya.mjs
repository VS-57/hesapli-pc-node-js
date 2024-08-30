import express from "express";
import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "itopya";

async function fetchPageData(page) {
  const browser = await puppeteer.launch();
  const [pageInstance] = await browser.pages();
  await pageInstance.goto(`https://www.itopya.com/HazirSistemler?pg=${page}`, {
    waitUntil: "networkidle2",
  });

  const content = await pageInstance.content();
  await browser.close();
  return content;
}

async function parseTotalPages(pageInstance) {
  const pageInfo = await pageInstance.$eval(
    ".page-info strong",
    (element) => element.textContent.trim()
  );
  const totalPages = parseInt(pageInfo.split("/")[1], 10);
  return totalPages;
}

async function parseProducts(pageInstance) {
  const products = await pageInstance.$$eval(".product", (productElements) =>
    productElements.map((product) => {
      const image = product.querySelector(".product-header .image img")?.dataset
        .src;
      const name = product.querySelector(".title").textContent.trim();
      const link =
        "https://www.itopya.com" +
        product.querySelector(".title").getAttribute("href");
      const priceText = product
        .querySelector(".price strong")
        .textContent.trim()
        .replace(/\s+/g, " ");
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const specsArray = Array.from(
        product.querySelectorAll(".product-body ul li")
      ).map((li) => ({
        specIcon: li.querySelector("img").getAttribute("src"),
        specText: li.querySelector("p").textContent.trim(),
      }));

      const specs = {
        CPU:
          (specsArray.find((spec) => spec.specText.includes("İşlemci")) || {})
            .specText || "N/A",
        Motherboard:
          (specsArray.find((spec) => spec.specText.includes("Anakart")) || {})
            .specText || "N/A",
        GPU:
          (specsArray.find((spec) =>
            spec.specText.includes("Ekran Kartı")
          ) || {}).specText || "N/A",
        Ram:
          (
            specsArray.find((spec) =>
              spec.specText.toLowerCase().includes("Ram".toLowerCase())
            ) || {}
          ).specText || "N/A",
        Storage:
          (specsArray.find((spec) => spec.specText.includes("SSD")) || {})
            .specText || "N/A",
      };

      return { name, price, image, link, specs, store: "itopya" };
    })
  );
  return products;
}

async function fetchAllProducts() {
  const browser = await puppeteer.launch();
  const [pageInstance] = await browser.pages();
  await pageInstance.goto("https://www.itopya.com/HazirSistemler?pg=1", {
    waitUntil: "networkidle2",
  });

  const totalPages = await parseTotalPages(pageInstance);
  let allProducts = await parseProducts(pageInstance);

  for (let page = 2; page <= totalPages; page++) {
    await pageInstance.goto(`https://www.itopya.com/HazirSistemler?pg=${page}`, {
      waitUntil: "networkidle2",
    });
    const products = await parseProducts(pageInstance);
    allProducts = allProducts.concat(products);
  }

  await browser.close();
  return allProducts;
}

router.get("/", async (req, res) => {
  try {
    const products = await fetchAllProducts();

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'itopya' store products
    await collection.deleteMany({ store: "itopya" });

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
