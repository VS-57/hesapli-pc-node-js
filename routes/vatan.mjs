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
    const productElements = doc.querySelectorAll(
      ".product-list.product-list--list-page .product-list-link"
    );

    productElements.forEach((productElement) => {
      const nameElement = productElement.querySelector(
        ".product-list__product-name h3"
      );
      const priceElement = productElement.querySelector(".product-list__price");
      const imageElement = productElement.querySelector(
        ".product-list__image-safe img"
      );

      const link =
        "https://www.vatanbilgisayar.com" + productElement.getAttribute("href");
      const name = nameElement ? nameElement.textContent.trim() : "No name";

      // Fiyatı al ve sayıya dönüştür
      const priceText = priceElement
        ? priceElement.textContent.trim().replace(/\s+/g, " ")
        : "0";
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const image = imageElement
        ? imageElement.getAttribute("data-src")
        : "No image";
      const specs = {};

      productElement
        .querySelectorAll(".productlist_spec ul li p")
        .forEach((specElement) => {
          const specNameElement = specElement.querySelector("#specname");
          const specValueElement = specElement.querySelector("#specvalue");
          const specName = specNameElement
            ? specNameElement.textContent.trim()
            : "";
          const specValue = specValueElement
            ? specValueElement.textContent.trim()
            : "";

          // Belirli anahtarlar ile eşleştirme yap
          if (specName.includes("İşlemci Numarası")) {
            specs["CPU"] = specValue;
          } else if (specName.includes("Grafik İşlemci")) {
            specs["GPU"] = specValue;
          } else if (specName.includes("Anakart Chipseti")) {
            specs["Motherboard"] = specValue;
          } else if (specName.includes("Ram (Sistem Belleği)")) {
            specs["Ram"] = specValue;
          }
        });

      products.push({ name, price, image, link, specs, store: "vatan" });
    });
  });

  await Promise.all(fetchPromises);
  return products;
}

function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? base : `${base}?page=${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.vatanbilgisayar.com/oem-hazir-sistemler/";
  const totalPages = 4;
  const urls = generateUrls(baseUrl, totalPages);
  try {
    const products = await fetchAllProducts(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
