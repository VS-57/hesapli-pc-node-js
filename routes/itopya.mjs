import express from "express";
import { MongoClient } from "mongodb";
import puppeteer from "puppeteer";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "itopya";

async function fetchPageData(page, browser) {
  const url = `https://www.itopya.com/HazirSistemler?pg=${page}`;
  const pageInstance = await browser.newPage();
  await pageInstance.goto(url, { waitUntil: "networkidle2" });

  // Return the page instance so we can interact with it later
  return pageInstance;
}

async function parseTotalPages(pageInstance) {
  const totalPages = await pageInstance.evaluate(() => {
    const pageInfoElement = document.querySelector(".page-info strong");
    if (pageInfoElement) {
      const pageInfo = pageInfoElement.textContent.trim();
      return parseInt(pageInfo.split("/")[1], 10);
    } else {
      console.error("Total pages element not found.");
      return 1; // Default to 1 page
    }
  });
  return totalPages;
}

async function parseProducts(pageInstance) {
  const products = await pageInstance.evaluate(() => {
    const productElements = document.querySelectorAll(".product");
    return Array.from(productElements).map((product) => {
      const imageElement = product.querySelector(".product-header .image img");
      const image = imageElement ? imageElement.dataset.src : "No image";

      const nameElement = product.querySelector(".title");
      const name = nameElement ? nameElement.textContent.trim() : "No name";

      const linkElement = product.querySelector(".title");
      const link = linkElement
        ? "https://www.itopya.com" + linkElement.getAttribute("href")
        : "No link";

      const priceElement = product.querySelector(".price strong");
      const priceText = priceElement
        ? priceElement.textContent.trim().replace(/\s+/g, " ")
        : "0";
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const specsArray = Array.from(
        product.querySelectorAll(".product-body ul li")
      ).map((li) => ({
        specIcon: li.querySelector("img")?.getAttribute("src") || "No icon",
        specText: li.querySelector("p")?.textContent.trim() || "No spec",
      }));

      const specs = {
        CPU:
          (specsArray.find((spec) => spec.specText.includes("İşlemci")) || {})
            .specText || "N/A",
        Motherboard:
          (specsArray.find((spec) => spec.specText.includes("Anakart")) || {})
            .specText || "N/A",
        GPU:
          (specsArray.find((spec) => spec.specText.includes("Ekran Kartı")) ||
            {}
          ).specText || "N/A",
        Ram:
          (
            specsArray.find((spec) =>
              spec.specText.toLowerCase().includes("ram")
            ) || {}
          ).specText || "N/A",
        Storage:
          (specsArray.find((spec) => spec.specText.includes("SSD")) || {})
            .specText || "N/A",
      };

      return { name, price, image, link, specs, store: "itopya" };
    });
  });

  return products;
}

async function fetchAllProducts() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const initialPageInstance = await fetchPageData(1, browser);

  const totalPages = await parseTotalPages(initialPageInstance);
  console.log(totalPages);

  let allProducts = await parseProducts(initialPageInstance);
  await initialPageInstance.close();

  for (let page = 2; page <= totalPages; page++) {
    const pageInstance = await fetchPageData(page, browser);
    const products = await parseProducts(pageInstance);
    allProducts = allProducts.concat(products);
    await pageInstance.close();
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
