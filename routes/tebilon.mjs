import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

async function getTotalPages(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return 1;
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const paginationElements = doc.querySelectorAll(
      ".productSort__pagination a"
    );
    const totalPages = Array.from(paginationElements)
      .map((el) => parseInt(el.textContent.trim()))
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a)[0];

    return totalPages || 1;
  } catch (error) {
    console.error(`Error fetching total pages from ${url}: ${error.message}`);
    return 1;
  }
}

async function fetchAllProducts(urls) {
  const products = [];
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.statusText}`);
        return;
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      let productElements = doc.querySelectorAll(".showcase__product");
      if (productElements.length > 39) {
        productElements = Array.from(productElements).slice(0, 40);
      }

      productElements.forEach((productElement) => {
        const nameElement = productElement.querySelector(".showcase__title a");
        const priceElement = productElement.querySelector(".newPrice");
        const imageElement = productElement.querySelector(
          ".showcase__image img"
        );

        const link = nameElement ? nameElement.href : "No link";
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
    } catch (error) {
      console.error(
        `Error fetching product list from ${url}: ${error.message}`
      );
    }
  });

  await Promise.all(fetchPromises);
  return products;
}

async function fetchProductDetails(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const specElements = doc.querySelectorAll(".spec-head");

    const tempSpecs = {};
    specElements.forEach((specElement) => {
      const titleElement = specElement.querySelector(".spec-sub-title span");
      const detailElement = specElement.querySelector(".spec-detail span");
      if (titleElement && detailElement) {
        const title = titleElement.textContent.trim();
        const detail = detailElement.textContent.trim();
        tempSpecs[title] = detail;
      }
    });

    const specs = {
      CPU: tempSpecs["İşlemci Modeli"] || "N/A",
      Motherboard: "N/A",
      GPU: tempSpecs["Grafik İşlemci"] || "N/A",
      Ram: tempSpecs["Ram Kapasitesi"] || "N/A",
      Case : (
        (tempSpecs["PSU"] || "") + " " + (tempSpecs["PSU Verimlilik"] || "")
      ).trim() === "" ? "N/A" : (tempSpecs["PSU"] || "") + " " + (tempSpecs["PSU Verimlilik"] || ""),
      Storage:
        (tempSpecs["Depolama Kapasitesi"] || "") +
        " " +
        (tempSpecs["Depolama Türü"] || "N/A"),
    };

    return specs;
  } catch (error) {
    console.error(
      `Error fetching product details from ${url}: ${error.message}`
    );
    return null;
  }
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

  try {
    const totalPages = await getTotalPages(baseUrl);
    const urls = generateUrls(baseUrl, totalPages);

    const products = await fetchAllProducts(urls);
    const detailPromises = products.map(async (product) => {
      product.specs = await fetchProductDetails(product.link);
      return product;
    });

    const productsWithDetails = await Promise.all(detailPromises);
    res.json(productsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
