import express from "express";
import axios from "axios";
import { MongoClient } from "mongodb";
import { JSDOM } from "jsdom";

const router = express.Router();

// MongoDB connection details
const mongoUrl = "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "itopya";

async function fetchPageData(page) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.itopya.com/',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
  };

  const { data: content } = await axios.get(
    `https://www.itopya.com/HazirSistemler?pg=${page}`,
    { headers }
  );
  return content;
}

async function parseTotalPages(document) {
  const pageInfo = document.querySelector(".page-info strong").textContent.trim();
  const totalPages = parseInt(pageInfo.split("/")[1], 10);
  return totalPages;
}

async function parseProducts(document) {
  const productElements = document.querySelectorAll(".product");
  const products = Array.from(productElements).map((product) => {
    const image = product.querySelector(".product-header .image img")?.dataset.src;
    const name = product.querySelector(".title").textContent.trim();
    const link = "https://www.itopya.com" + product.querySelector(".title").getAttribute("href");
    const priceText = product.querySelector(".price strong").textContent.trim().replace(/\s+/g, " ");
    const price = parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    const specsArray = Array.from(product.querySelectorAll(".product-body ul li")).map((li) => ({
      specIcon: li.querySelector("img").getAttribute("src"),
      specText: li.querySelector("p").textContent.trim(),
    }));

    const specs = {
      CPU: (specsArray.find((spec) => spec.specText.includes("İşlemci")) || {}).specText || "N/A",
      Motherboard: (specsArray.find((spec) => spec.specText.includes("Anakart")) || {}).specText || "N/A",
      GPU: (specsArray.find((spec) => spec.specText.includes("Ekran Kartı")) || {}).specText || "N/A",
      Ram: (specsArray.find((spec) => spec.specText.toLowerCase().includes("Ram".toLowerCase())) || {}).specText || "N/A",
      Storage: (specsArray.find((spec) => spec.specText.includes("SSD")) || {}).specText || "N/A",
    };

    return { name, price, image, link, specs, store: "itopya" };
  });
  return products;
}

async function fetchAllProducts() {
  const initialContent = await fetchPageData(1);
  const initialDocument = new JSDOM(initialContent).window.document;
  
  const totalPages = await parseTotalPages(initialDocument);
  let allProducts = await parseProducts(initialDocument);

  for (let page = 2; page <= totalPages; page++) {
    const content = await fetchPageData(page);
    const document = new JSDOM(content).window.document;
    const products = await parseProducts(document);
    allProducts = allProducts.concat(products);
  }

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
