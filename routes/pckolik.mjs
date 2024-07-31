import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

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
    const name = nameElement ? nameElement.textContent.trim() : "N/A";
    const price = priceElement ? priceElement.textContent.trim() : "N/A";
    const features = Array.from(featuresList).map((feature) =>
      feature.textContent.trim()
    );
    products.push({ name, price, features });
  });
  return products;
}

async function scrapeMultiplePages(urls) {
  let allProducts = [];
  for (let url of urls) {
    const products = await fetchAndScrapeProductData(url);
    allProducts = allProducts.concat(products);
  }
  return allProducts;
}

/**
 * @swagger
 * /api/pckolik:
 *   get:
 *     summary: Get all products from PCKolik
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/", async (req, res) => {
  const baseUrl = "https://pckolik.com/tr/pc/hazir-sistemler";
  const urls = [`${baseUrl}`, `${baseUrl}?page=2`];
  try {
    const products = await scrapeMultiplePages(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
