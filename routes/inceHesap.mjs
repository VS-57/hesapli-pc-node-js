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
      ".grid.grid-cols-2.md\\:grid-cols-3.gap-1 > div"
    );

    productElements.forEach((productElement) => {
      const linkElement = productElement.querySelector("a[itemprop='url']");
      const imageElement = productElement.querySelector("img");
      const nameElement = productElement.querySelector(
        "p.text-lg.text-center.truncate.font-semibold[title]"
      );
      const priceElement = productElement.querySelector(".text-orange-500");

      const link =
        "https://www.incehesap.com" + linkElement.getAttribute("href");
      const name = nameElement ? nameElement.textContent.trim() : "No name";

      // Fiyatı al ve sayıya dönüştür
      const priceText = priceElement
        ? priceElement.textContent.trim().replace(/\s+/g, " ")
        : "0";
      const price =
        parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

      const image = imageElement
        ? "https://www.incehesap.com" + imageElement.getAttribute("src")
        : "No image";

      const specs = {};

      productElement.querySelectorAll("ul li").forEach((specElement) => {
        const specText = specElement.textContent.trim();

        // Belirli anahtarlar ile eşleştirme yap
        if (specText.includes("AMD") || specText.includes("Intel")) {
          specs["CPU"] = specText;
        } else if (
          specText?.toLowerCase().includes("rtx") ||
          specText?.toLowerCase().includes("rx") ||
          specText?.toLowerCase().includes("gtx") ||
          specText?.toLowerCase().includes("arc")
        ) {
          specs["GPU"] = specText;
        } else if (specText.includes("DDR4") || specText.includes("DDR5")) {
          specs["Ram"] = specText;
        } else if (specText.includes("SSD")) {
          specs["Storage"] = specText;
        }
      });

      products.push({ name, price, image, link, specs, store: "inceHesap" });
    });
  });

  await Promise.all(fetchPromises);
  return products;
}

function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? base : `${base}sayfa-${i}/`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.incehesap.com/hazir-sistemler-fiyatlari/";
  const totalPages = 14; // Örnek olarak toplam 14 sayfa olduğu varsayıldı
  const urls = generateUrls(baseUrl, totalPages);
  try {
    const products = await fetchAllProducts(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
