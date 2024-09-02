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

  const content = await pageInstance.content();
  await pageInstance.close();
  return content;
}

async function parseTotalPages(document) {
  const pageInfoElement = document.querySelector(".page-info strong");
  if (pageInfoElement) {
    const pageInfo = pageInfoElement.textContent.trim();
    const totalPages = parseInt(pageInfo.split("/")[1], 10);
    return totalPages;
  } else {
    console.error("Total pages element not found.");
    return 1; // Default to 1 page
  }
}

async function parseProducts(document) {
  const productElements = document.querySelectorAll(".product");
  const products = Array.from(productElements).map((product) => {
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
        (specsArray.find((spec) => spec.specText.includes("Ekran Kartı")) || {})
          .specText || "N/A",
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
  return products;
}

async function fetchAllProducts() {
  const browser = await puppeteer.launch();
  const initialContent = await fetchPageData(1, browser);
  const initialDocument = new JSDOM(initialContent).window.document;

  const totalPages = await parseTotalPages(initialDocument);
  console.log(totalPages);
  let allProducts = await parseProducts(initialDocument);

  for (let page = 2; page <= totalPages; page++) {
    const content = await fetchPageData(page, browser);
    const document = new JSDOM(content).window.document;
    const products = await parseProducts(document);
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
