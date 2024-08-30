import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "gencerGaming";

// Function to fetch page data
async function fetchPageData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Error fetching page ${url}: ${response.statusText}`);
    const text = await response.text();
    const dom = new JSDOM(text);
    return dom.window.document;
  } catch (error) {
    throw new Error(`Failed to fetch page ${url}: ${error.message}`);
  }
}

// Function to get total pages
async function getTotalPages(baseUrl) {
  try {
    const doc = await fetchPageData(baseUrl);
    const totalPagesElement = doc.querySelector(
      ".pagination-nav .pagination li:nth-last-child(1) a"
    );
    return totalPagesElement
      ? parseInt(totalPagesElement.textContent.trim(), 10)
      : 1;
  } catch (error) {
    throw new Error(`Failed to fetch total pages: ${error.message}`);
  }
}

// Function to fetch and parse all products
async function fetchAllProducts(urls) {
  const products = [];

  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const productElements = doc.querySelectorAll(".card-product");

      productElements.forEach((productElement) => {
        const nameElement = productElement.querySelector(".title.hzr");
        const priceElement = productElement.querySelector(".sale-price");
        const imageElement = productElement.querySelector(".image img");
        const linkElement = productElement.querySelector(".c-p-i-link");

        if (!nameElement || !priceElement || !imageElement || !linkElement) {
          return;
        }

        const link = linkElement.href;
        const name = nameElement ? nameElement.textContent.trim() : "No name";

        // Parse the price
        const priceText = priceElement
          ? priceElement.textContent.trim().replace(" TL", "")
          : "0";

        const tprice = parseFloat(priceText.replace(".", "")) || 0;
        const price = tprice.toString().replace(",", "");

        const image = null;
        /* const image = imageElement
          ? imageElement.getAttribute("src")
          : "No image"; */

        const specs = {};

        productElement
          .querySelectorAll(".attributes .nitelik li")
          .forEach((specElement) => {
            const specIcon = specElement.querySelector("img").src;
            const specValue = specElement
              .querySelector(".value")
              .textContent.trim();
            if (specIcon.includes("islemci.png")) {
              specs["CPU"] = specValue;
            } else if (specIcon.includes("ekran_kart")) {
              specs["GPU"] = specValue;
            } else if (specIcon.includes("ram.png")) {
              specs["Ram"] = specValue + " Ram";
            } else if (specIcon.includes("depolama.png")) {
              specs["Storage"] = specValue;
            } else if (specIcon.includes("anakart.png")) {
              specs["Motherboard"] = specValue;
            }
          });

        products.push({
          name,
          price,
          image,
          link,
          specs,
          store: "gencergaming",
        });
      });
    } catch (error) {
      console.error("Error fetching URL:", url, error);
    }
  });

  await Promise.all(fetchPromises);
  return products;
}

// Function to generate URLs for pagination
function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = `${base}${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.gencergaming.com/hazir-sistemler?sayfa=";
  try {
    const totalPages = await getTotalPages(baseUrl);
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(urls);

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'gencergaming' store products
    await collection.deleteMany({ store: "gencergaming" });

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
