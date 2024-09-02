import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { MongoClient } from "mongodb";
import axios from "axios";
import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

const router = express.Router();

const proxyAddress = "216.173.84.218:6133"; // Proxy IP and port
const proxyUsername = "KE4rXkUJ"; // Proxy username
const proxyPassword = "KE4rXkUJ"; // Proxy password
const apikey = "6f0992eec3d5c03b0a10ca458eb4c434b6e4cc37"; // ZenRows API anahtarı

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "vatan"; // Collection name set to "vatan"

async function getTotalPages(url) {
  try {
    const response = await axios({
      url: "https://api.zenrows.com/v1/",
      method: "GET",
      params: {
        url: url,
        apikey: apikey,
      },
    });

    // DOM'u parçalayıcı bir kütüphane olan cheerio'yu kullanarak HTML'den elemanları çekiyoruz
    const cheerio = require("cheerio");
    const $ = cheerio.load(response.data);

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
      const response = await axios({
        url: "https://api.zenrows.com/v1/",
        method: "GET",
        params: {
          url: url,
          apikey: apikey,
          js_render: "true",
          premium_proxy: "true",
        },
      });

      const $ = cheerio.load(response.data); // HTML yanıtını cheerio ile yüklüyoruz

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Proxy authentication
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });

    // Set user agent and language preferences
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "tr-TR,tr;q=0.9",
    });

    // Set Geolocation to Istanbul, Turkey
    await page.setGeolocation({ latitude: 41.0082, longitude: 28.9784 });
    await page.emulateTimezone("Europe/Istanbul");

    /* const totalPages = await getTotalPages(page, baseUrl);
    console.log(totalPages) */
    const totalPages = 6;
    const urls = generateUrls(baseUrl, totalPages);
    const products = await fetchAllProducts(urls);
    await browser.close();

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
