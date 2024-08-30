import express from "express";
import puppeteer from "puppeteer";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "vatan"; // Collection name set to "vatan"

async function getTotalPages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const totalPages = await page.evaluate(() => {
      const paginationItems = document.querySelectorAll(".pagination__item");
      if (paginationItems.length < 2) {
        return 1;
      }

      const secondToLastItem = paginationItems[paginationItems.length - 2];
      return parseInt(secondToLastItem.textContent.trim(), 10) || 1;
    });

    console.log(`Total Pages: ${totalPages}`);
    return totalPages;
  } catch (error) {
    console.error(`Error fetching total pages from ${url}: ${error.message}`);
    return 1;
  } finally {
    await browser.close();
  }
}

async function fetchAllProducts(urls) {
  const products = [];
  const browser = await puppeteer.launch();

  try {
    const fetchPromises = urls.map(async (url) => {
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle2" });

        const pageProducts = await page.evaluate(() => {
          const productElements = document.querySelectorAll(
            ".product-list.product-list--list-page .product-list-link"
          );
          const products = [];

          productElements.forEach((productElement) => {
            const nameElement = productElement.querySelector(
              ".product-list__product-name h3"
            );
            const priceElement = productElement.querySelector(
              ".product-list__price"
            );
            const imageElement = productElement.querySelector(
              ".product-list__image-safe img"
            );

            const link =
              "https://www.vatanbilgisayar.com" +
              productElement.getAttribute("href");
            const name = nameElement
              ? nameElement.textContent.trim()
              : "No name";

            const priceText = priceElement
              ? priceElement.textContent.trim().replace(/\s+/g, " ")
              : "0";
            const price =
              parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) ||
              0;

            const image = imageElement
              ? imageElement.getAttribute("data-src")
              : "No image";
            const specs = {};

            productElement
              .querySelectorAll(".productlist_spec ul li p")
              .forEach((specElement) => {
                const specNameElement = specElement.querySelector("#specname");
                const specValueElement =
                  specElement.querySelector("#specvalue");
                const specName = specNameElement
                  ? specNameElement.textContent.trim()
                  : "";
                const specValue = specValueElement
                  ? specValueElement.textContent.trim()
                  : "";

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

          return products;
        });

        products.push(...pageProducts);
      } catch (error) {
        console.error(
          `Error fetching product list from ${url}: ${error.message}`
        );
      } finally {
        await page.close();
      }
    });

    await Promise.all(fetchPromises);
  } finally {
    await browser.close();
  }

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

  try {
    const totalPages = await getTotalPages(baseUrl);
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(urls);

    // MongoDB connection
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Remove existing 'vatan' store products
    await collection.deleteMany({ store: "vatan" });

    // Insert new products into MongoDB
    if (products.length > 0) {
      await collection.insertMany(products);
    }

    // Close MongoDB connection
    await client.close();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
