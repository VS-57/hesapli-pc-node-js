import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "gameGaraj";

// Function to fetch page data
async function fetchPageData(page) {
  try {
    const response = await fetch(
      `https://www.gamegaraj.com/grup/masaustu-bilgisayar/page/${page}/`
    );
    if (!response.ok)
      throw new Error(`Error fetching page ${page}: ${response.statusText}`);
    const text = await response.text();
    const dom = new JSDOM(text);
    return dom.window.document;
  } catch (error) {
    throw new Error(`Failed to fetch page ${page}: ${error.message}`);
  }
}

// Function to get total pages
async function getTotalPages() {
  try {
    const response = await fetch(
      `https://www.gamegaraj.com/grup/masaustu-bilgisayar/`
    );
    if (!response.ok)
      throw new Error(`Error fetching total pages: ${response.statusText}`);
    const text = await response.text();
    const dom = new JSDOM(text);
    const totalPagesElement = dom.window.document.querySelector(
      ".woocommerce-pagination .page-numbers li:nth-last-child(2) a"
    );
    return totalPagesElement
      ? parseInt(totalPagesElement.textContent.trim(), 10)
      : 1;
  } catch (error) {
    throw new Error(`Failed to fetch total pages: ${error.message}`);
  }
}

// Function to parse products from a page
function parseProducts(doc) {
  const productElements = doc.querySelectorAll(".products li.product");
  return Array.from(productElements).map((product) => {
    const imageElement = product.querySelector(".edgtf-pl-image img");
    const titleElement = product.querySelector(".edgtf-product-list-title a");
    const priceElement = product.querySelector(
      ".price ins .woocommerce-Price-amount"
    );
    const specsElement = product.querySelector(
      'div[itemprop="description"] ul'
    ); // Technical specifications area

    // Convert price to a number
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let priceNumber = null;

    if (priceText) {
      const normalizedPriceText = priceText
        .replace(/,/g, "")
        .replace(/[^0-9.]/g, "");
      priceNumber = parseFloat(normalizedPriceText);
    }

    // Extract specifications
    const specsList = specsElement
      ? Array.from(specsElement.querySelectorAll("li")).map((li) =>
          li.textContent.trim()
        )
      : [];

    // Functions to find specific specs
    const findGPU = (list) => {
      return (
        list.find(
          (x) =>
            x.toLowerCase().includes("rtx") ||
            x.toLowerCase().includes("gtx") ||
            x.toLowerCase().includes("rx")
        ) || "N/A"
      );
    };

    const findRAM = (list) => {
      return (
        list
          .slice()
          .reverse()
          .find(
            (x) =>
              (x.toLowerCase().includes("mhz") &&
                x.toLowerCase().includes("gb")) ||
              x.toLowerCase().includes("ram") ||
              x.toLowerCase().includes("cl")
          ) || "N/A"
      );
    };

    const findStorage = (list) => {
      return (
        list
          .slice()
          .reverse()
          .find(
            (x) =>
              (x.toLowerCase().includes("ssd") ||
                x.toLowerCase().includes("m.2") ||
                x.toLowerCase().includes("m2") ||
                x.toLowerCase().includes("nvme")) &&
              (x.toLowerCase().includes("gb") || x.toLowerCase().includes("tb"))
          ) || "N/A"
      );
    };

    // Build the specs object
    const specs = specsList.reduce((acc, spec, index) => {
      if (index === 0) acc["CPU"] = spec;
      else if (index === 1) acc["Motherboard"] = spec;
      else if (index === 2) acc["GPU"] = findGPU(specsList);
      else if (index === 3) acc["Ram"] = findRAM(specsList);
      else if (index === 4) acc["Storage"] = findStorage(specsList);
      return acc;
    }, {});

    // Handle cases where specsList length is not 5
    if (specsList.length !== 5) {
      if (!specs["Ram"]) specs["Ram"] = findRAM(specsList);
      if (!specs["Storage"]) specs["Storage"] = findStorage(specsList);
    }

    return {
      image: imageElement ? imageElement.getAttribute("src") : null,
      name: titleElement ? titleElement.textContent.trim() : null,
      price: priceNumber,
      link: titleElement ? titleElement.getAttribute("href") : null,
      specs: specs,
      store: "gameGaraj",
    };
  });
}

// Function to fetch all products
async function fetchAllProducts(totalPages) {
  let allProducts = [];
  for (let page = 1; page <= totalPages; page++) {
    try {
      const doc = await fetchPageData(page);
      const products = parseProducts(doc);
      allProducts = allProducts.concat(products);
    } catch (error) {
      console.error(
        `Error fetching products from page ${page}: ${error.message}`
      );
    }
  }
  return allProducts;
}

router.get("/", async (req, res) => {
  try {
    const totalPages = await getTotalPages();
    const products = await fetchAllProducts(totalPages);

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'gameGaraj' store products
    await collection.deleteMany({ store: "gameGaraj" });

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
