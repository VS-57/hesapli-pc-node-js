import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

async function fetchAllProducts(urls) {
  const products = [];
  const fetchPromises = urls.map(async (url) => {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const productElements = doc.querySelectorAll(".showcase__product");

    productElements.forEach((productElement) => {
      const nameElement = productElement.querySelector(".showcase__title a");
      const priceElement = productElement.querySelector(".newPrice");
      const imageElement = productElement.querySelector(".showcase__image img");

      const link = productElement.querySelector(".showcase__title a").href;
      const name = nameElement ? nameElement.textContent.trim() : "No name";

      // Parse the price
      const priceText = priceElement
        ? priceElement.textContent
            .trim()
            .replace(/\s+/g, " ")
            .replace(" TL", "")
        : "0";
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const image = imageElement
        ? imageElement.getAttribute("src")
        : "No image";

      products.push({ name, price, image, link, store: "tebilon" });
    });
  });

  await Promise.all(fetchPromises);
  return products;
}

function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = `${base}?page=${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.tebilon.com/hazir-sistemler/";
  const totalPages = parseInt(req.query.pages, 6) || 1; // Default to 1 if pages query parameter is not provided
  const urls = generateUrls(baseUrl, totalPages);

  try {
    const products = await fetchAllProducts(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
