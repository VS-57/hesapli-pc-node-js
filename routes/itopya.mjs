import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

async function fetchPageData(page) {
  const response = await fetch(
    `https://www.itopya.com/HazirSistemler?pg=${page}`
  );
  const text = await response.text();
  const dom = new JSDOM(text);
  return dom.window.document;
}

function parseProducts(doc) {
  const productElements = doc.querySelectorAll(".product");
  return Array.from(productElements).map((product) => {
    const image = product
      .querySelector(".product-header .image img")
      .getAttribute("data-src");
    const name = product.querySelector(".title").textContent.trim();
    const link =
      "https://www.itopya.com" +
      product.querySelector(".title").getAttribute("href");
    const priceText = product
      .querySelector(".price strong")
      .textContent.trim()
      .replace(/\s+/g, " ");
    const price =
      parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    const specsArray = Array.from(
      product.querySelectorAll(".product-body ul li")
    ).map((li) => ({
      specIcon: li.querySelector("img").getAttribute("src"),
      specText: li.querySelector("p").textContent.trim(),
    }));

    const specs = {
      CPU:
        (specsArray.find((spec) => spec.specText.includes("İşlemci")) || {})
          .specText || "N/A",
      Motherboard:
        (specsArray.find((spec) => spec.specText.includes("Anakart")) || {})
          .specText || "N/A",
      GPU:
        (specsArray.find((spec) => spec.specText.includes("Ekran Kartı")) || {})
          .specText || "N/A",
      Ram:
        (
          specsArray.find((spec) =>
            spec.specText.toLowerCase().includes("Ram".toLowerCase())
          ) || {}
        ).specText || "N/A",
      Storage:
        (specsArray.find((spec) => spec.specText.includes("SSD")) || {})
          .specText || "N/A",
    };

    return { name, price, image, link, specs, store: "itopya" };
  });
}

async function fetchAllProducts(totalPages) {
  let allProducts = [];
  for (let page = 1; page <= totalPages; page++) {
    const doc = await fetchPageData(page);
    const products = parseProducts(doc);
    allProducts = allProducts.concat(products);
  }
  return allProducts;
}

router.get("/", async (req, res) => {
  try {
    const totalPages = 23;
    const products = await fetchAllProducts(totalPages);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
