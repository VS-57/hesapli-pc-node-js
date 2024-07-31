import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

// Sayfa verilerini çekme fonksiyonu
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

// Ürünleri ayrıştırma fonksiyonu
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
    ); // Teknik özelliklerin bulunduğu alan

    // Fiyatı sayıya çevirme
    let priceText = priceElement ? priceElement.textContent.trim() : null;
    let priceNumber = null;

    if (priceText) {
      const normalizedPriceText = priceText
        .replace(/,/g, "")
        .replace(/[^0-9.]/g, "");
      priceNumber = parseFloat(normalizedPriceText);
    }

    // Teknik özellikleri al
    const specsList = specsElement
      ? Array.from(specsElement.querySelectorAll("li")).map((li) =>
          li.textContent.trim()
        )
      : [];

    // Teknik özellikleri başlık ve değer çiftlerine dönüştürme
    const specs = specsList.reduce((acc, spec, index) => {
      if (index === 0) acc["CPU"] = spec;
      else if (index === 1) acc["Motherboard"] = spec;
      else if (index === 2) acc["GPU"] = spec;
      else if (index === 3) acc["RAM"] = spec;
      else if (index === 4) acc["Storage"] = spec;
      return acc;
    }, {});

    return {
      image: imageElement ? imageElement.getAttribute("src") : null,
      name: titleElement ? titleElement.textContent.trim() : null,
      price: priceNumber,
      link: titleElement ? titleElement.getAttribute("href") : null,
      specs: specs, // Teknik özellikler başlık ve değer çiftlerine dönüştürüldü
    };
  });
}

// Tüm ürünleri almak için fonksiyon
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
      // Hata mesajını istemciye iletmek yerine sadece loglama yapıyoruz
    }
  }
  return allProducts;
}

/**
 * @swagger
 * /api/game-garaj:
 *   get:
 *     summary: Get all products from Game Garaj
 *     description: Fetches a list of products from Game Garaj across multiple pages.  
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
 *                   image:
 *                     type: string
 *                     example: "https://example.com/image.jpg"
 *                   name:
 *                     type: string
 *                     example: "Product Name"
 *                   price:
 *                     type: number
 *                     example: 1234.56
 *                   link:
 *                     type: string
 *                     example: "https://example.com/product"
 *                   specs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         specText:
 *                           type: string
 *                           example: "Intel® Core™ i3 14100F 3.5 GHz 4.7 GHz 12MB"
 *       500:
 *         description: Error message if something goes wrong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch page 1: Error message"
 */
router.get("/", async (req, res) => {
  try {
    const totalPages = parseInt(req.query.totalPages, 10) || 8; // Dinamik sayfa sayısı
    const products = await fetchAllProducts(totalPages);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
