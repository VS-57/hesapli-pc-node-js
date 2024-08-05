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
      const productElements = doc.querySelectorAll(".card-product");

      productElements.forEach((productElement) => {
        const nameElement = productElement.querySelector(".title.hzr");
        const priceElement = productElement.querySelector(".sale-price");
        const imageElement = productElement.querySelector(".image img");
        const linkElement = productElement.querySelector(".c-p-i-link");

        if (!nameElement || !priceElement || !imageElement || !linkElement) {
          return;
        }

        const link = linkElement.href;
        const name = nameElement ? nameElement.textContent.trim() : "No name";

        // Parse the price
        const priceText = priceElement
          ? priceElement.textContent.trim().replace(" TL", "").replace(",", ".")
          : "0";
        const price = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0;

        const image = imageElement
          ? imageElement.getAttribute("src")
          : "No image";

        const specs = {};

        productElement
          .querySelectorAll(".attributes .nitelik li")
          .forEach((specElement) => {
            const specIcon = specElement.querySelector("img").src;
            const specValue = specElement
              .querySelector(".value")
              .textContent.trim();
            if (specIcon.includes("islemci.png")) {
              specs["CPU"] = specValue;
            } else if (specIcon.includes("ekran_kart")) {
              specs["GPU"] = specValue;
            } else if (specIcon.includes("ram.png")) {
              specs["Ram"] = specValue + " Ram";
            } else if (specIcon.includes("depolama.png")) {
              specs["Storage"] = specValue;
            } else if (specIcon.includes("anakart.png")) {
              specs["Motherboard"] = specValue;
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
