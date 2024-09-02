import express from "express";
import cloudScraper from "cloudscraper";
import { MongoClient } from "mongodb";
import * as cheerio from "cheerio";

const router = express.Router();

const proxyAddress = "216.173.84.218:6133"; // Proxy IP and port
const proxyUsername = "KE4rXkUJ"; // Proxy username
const proxyPassword = "KE4rXkUJ"; // Proxy password

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "vatan"; // Collection name set to "vatan"

async function getTotalPages(url) {
  try {
    const response = await cloudScraper.get({
      uri: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
    });

    const $ = cheerio.load(response);

    const paginationItems = $(".pagination__item");

    const secondToLastItem = paginationItems
      .eq(paginationItems.length - 2)
      .text();
    console.log(secondToLastItem);
    return parseInt(secondToLastItem.replace(/[^\d]/g, ""), 10) || 1;
  } catch (error) {
    console.error("Error fetching total pages:", error);
    return 1; // Hata durumunda 1 sayfa varsayıyoruz
  }
}

async function fetchAllProducts(urls) {
  const products = [];

  for (const url of urls) {
    try {
      const response = await cloudScraper.get({
        uri: url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
      });

      const $ = cheerio.load(response); // HTML yanıtını cheerio ile yüklüyoruz

      const productElements = $(
        ".product-list.product-list--list-page .product-list-link"
      );

      const productsOnPage = Array.from(productElements).map(
        (productElement) => {
          const nameElement = $(productElement).find(
            ".product-list__product-name h3"
          );
          const priceElement = $(productElement).find(".product-list__price");
          const imageElement = $(productElement).find(
            ".product-list__image-safe img"
          );

          const link =
            "https://www.vatanbilgisayar.com" + $(productElement).attr("href");
          const name = nameElement.length
            ? nameElement.text().trim()
            : "No name";

          const priceText = priceElement.length
            ? priceElement.text().trim().replace(/\s+/g, " ")
            : "0";
          const price =
            parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

          const image = imageElement.length
            ? imageElement.attr("data-src")
            : "No image";
          const specs = {};

          $(productElement)
            .find(".productlist_spec ul li p")
            .each((_, specElement) => {
              const specNameElement = $(specElement).find("#specname");
              const specValueElement = $(specElement).find("#specvalue");
              const specName = specNameElement.length
                ? specNameElement.text().trim()
                : "";
              const specValue = specValueElement.length
                ? specValueElement.text().trim()
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

          return { name, price, image, link, specs, store: "vatan" };
        }
      );

      products.push(...productsOnPage);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
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
    console.log(totalPages);
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(urls);

    // MongoDB connection
    const client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      // Remove existing 'vatan' store products
      await collection.deleteMany({ store: "vatan" });

      // Insert new products into MongoDB
      if (products.length > 0) {
        await collection.insertMany(products);
      }

      res.json(products);
    } catch (dbError) {
      console.error(`Database error: ${dbError.message}`);
      res.status(500).json({ error: `Database error: ${dbError.message}` });
    } finally {
      await client.close();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
