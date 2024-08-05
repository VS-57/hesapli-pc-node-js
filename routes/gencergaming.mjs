import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const router = express.Router();

async function fetchAllProducts(urls) {
  const products = [];

  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const productElements = doc.querySelectorAll(".product-item");

      productElements.forEach((productElement) => {
        const nameElement = productElement.querySelector(".product-title a");
        const priceElement = productElement.querySelector(".price");
        const imageElement = productElement.querySelector(".product-image img");

        if (!nameElement || !priceElement || !imageElement) {
          console.log("Missing elements:", {
            nameElement,
            priceElement,
            imageElement,
          });
          return;
        }

        const link =
          "https://www.gencergaming.com/" +
          productElement.querySelector(".product-image a").href;
        const name = nameElement ? nameElement.textContent.trim() : "No name";

        // Parse the price
        const priceText = priceElement
          ? priceElement.textContent.trim().replace(/\s+/g, " ").replace("₺", "")
          : "0";
        const price =
          parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

        const image = imageElement
          ? imageElement.getAttribute("src")
          : "No image";

        const specs = {};

        productElement
          .querySelectorAll(".technicalSpecs li")
          .forEach((specElement) => {
            const [specName, specValue] = specElement.textContent
              .split(":")
              .map((s) => s.trim());
            if (specName && specValue) {
              if (specName.includes("İşlemci Modeli")) {
                specs["CPU"] =
                  specValue +
                  " " +
                  findNumberAndNextChar(name).number +
                  findNumberAndNextChar(name).nextChar;
              } else if (specName.includes("Ekran Kartı")) {
                specs["GPU"] = specValue;
              } else if (specName.includes("Anakart")) {
                specs["Motherboard"] = specValue;
              } else if (specName.includes("RAM")) {
                specs["Ram"] = specValue + " Ram";
              }
            }
          });

        products.push({
          name,
          price,
          image,
          link,
          specs,
          store: "gencergaming",
        });
      });
    } catch (error) {
      console.error("Error fetching URL:", url, error);
    }
  });

  await Promise.all(fetchPromises);
  return products;
}

function findNumberAndNextChar(name) {
  const regex = /\b(\d{4,5})(.)/;
  const match = name.match(regex);
  if (match) {
    const number = match[1];
    const nextChar = match[2];
    return { number, nextChar };
  }
  return null;
}

function generateUrls(base, totalPages) {
  const urls = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = `${base}${i}`;
    urls.push(url);
  }
  return urls;
}

router.get("/", async (req, res) => {
  const baseUrl = "https://www.gencergaming.com/hazir-sistemler?sayfa=";
  const totalPages = 4; // Update this if there are more pages
  const urls = generateUrls(baseUrl, totalPages);
  try {
    const products = await fetchAllProducts(urls);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
