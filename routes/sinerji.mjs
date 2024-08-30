import express from "express";
import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";
import { JSDOM } from "jsdom"; // Import JSDOM since it's being used in the function

const router = express.Router();

const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "sinerji";

async function fetchPageData(url, page) {
  await page.goto(url, { waitUntil: "networkidle2" });
  const content = await page.content();
  const dom = new JSDOM(content);
  return dom.window.document;
}

function parseTotalPages(doc) {
  const pagingElements = doc.querySelectorAll(".paging a");
  const secondLastPageElement = pagingElements[pagingElements.length - 2];
  const totalPages = parseInt(secondLastPageElement.textContent, 10);
  return totalPages;
}

async function fetchAllProducts(urls, page) {
  const products = [];
  for (const url of urls) {
    const doc = await fetchPageData(url, page);
    const productElements = doc.querySelectorAll(".product");

    productElements.forEach((productElement) => {
      const nameElement = productElement.querySelector(".title a");
      const priceElement = productElement.querySelector(".price");
      const imageElement = productElement.querySelector(".img img");

      const link =
        "https://www.sinerji.gen.tr/" +
        productElement.querySelector(".img a").href;
      const name = nameElement ? nameElement.textContent.trim() : "No name";

      const priceText = priceElement
        ? priceElement.textContent.trim().replace(/\s+/g, " ").replace("₺", "")
        : "0";
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const image = imageElement
        ? imageElement.getAttribute("src")
        : "No image";

      const specs = {};

      productElement
        .querySelectorAll(".technicalSpecs li")
        .forEach((specElement) => {
          const [specName, specValue] = specElement.textContent
            .split(":")
            .map((s) => s.trim());
          if (specName && specValue) {
            if (specName.includes("İşlemci Modeli")) {
              specs["CPU"] =
                specValue +
                " " +
                findNumberAndNextChar(name).number +
                findNumberAndNextChar(name).nextChar;
            } else if (specName.includes("Ekran Kartı")) {
              specs["GPU"] = specValue;
            } else if (specName.includes("Anakart")) {
              specs["Motherboard"] = specValue;
            } else if (specName.includes("RAM")) {
              specs["Ram"] = specValue + " Ram";
            }
          }
        });

      products.push({ name, price, image, link, specs, store: "sinerji" });
    });
  }
  return products;
}

function findNumberAndNextChar(name) {
  const regex = /\b(\d{4,5})(.)/;
  const match = name.match(regex);
  if (match) {
    const number = match[1];
    const nextChar = match[2];
    return { number, nextChar };
  }
  return null;
}

async function generateUrls(baseUrl, page) {
  const initialDoc = await fetchPageData(baseUrl, page);
  const totalPages = parseTotalPages(initialDoc);
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? baseUrl : `${baseUrl}?px=${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.sinerji.gen.tr/hazir-sistemler-c-2107";
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const urls = await generateUrls(baseUrl, page);
    const products = await fetchAllProducts(urls, page);
    await browser.close();

    // Connect to MongoDB
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'sinerji' store products from the collection
    await collection.deleteMany({ store: "sinerji" });

    // Insert new products into the collection
    if (products.length > 0) {
      await collection.insertMany(products);
    }

    // Close the MongoDB connection
    await client.close();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
