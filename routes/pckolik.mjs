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

    const tempCpu =
      features.find(
        (x) =>
          x.toLowerCase().includes("ryzen") ||
          x.toLowerCase().includes("core") ||
          x.toLowerCase().includes("İŞLEMCİ".toLowerCase()) ||
          x.toLowerCase().includes("ISLEMCI".toLowerCase())
      ) || "N/A";

    const tempGpu =
      features.find(
        (x) =>
          x.toLowerCase().includes("rx") ||
          x.toLowerCase().includes("gtx") ||
          x.toLowerCase().includes("rtx") ||
          x.toLowerCase().includes("arc")
      ) || "N/A";

    const specs = {
      CPU: tempCpu,
      Motherboard: features.find((x) => x.toLowerCase().includes("anakart")),
      GPU: tempGpu,
      Ram: features.find((x) => x.toLowerCase().includes("ram")),
      Case: features.find((x) => x.toLowerCase().includes("kasa")) || "N/A",
      Storage: features.find((x) => x.toLowerCase().includes("ssd")) || "N/A",
    };

    products.push({ name, price, image, link, specs, store: "pckolik" });
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

router.get("/", async (req, res) => {
  const baseUrl = "https://pckolik.com/tr/pc/hazir-sistemler";
  const urls = [`${baseUrl}`];
  try {
    const products = await scrapeMultiplePages(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
