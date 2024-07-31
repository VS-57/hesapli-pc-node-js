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

    // Array.from(featuresList) ile features'ı al ve ilk üç elemanı 'specs' olarak düzenle
    const features = Array.from(featuresList).map((feature) =>
      feature.textContent.trim()
    );

    const specs = {
      CPU: features[0] || "N/A",
      Motherboard: features[1] || "N/A",
      GPU: features[2] || "N/A",
      Ram: features[3] || "N/A",
      Case: features[4] || "N/A",
      Storage: features[5] || "N/A",
    };

    products.push({ name, price, image, link, specs });
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
 *                   img:
 *                     type: string
 *                     description: URL of the product image
 *                   link:
 *                     type: string
 *                     description: URL of the product page
 *                   specs:
 *                     type: object
 *                     properties:
 *                       CPU:
 *                         type: string
 *                       GPU:
 *                         type: string
 *                       motherboard:
 *                         type: string
 *                       ram:
 *                         type: string
 *                  
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
