import express from "express";
import puppeteer from "puppeteer";
import fs from "fs/promises";

const router = express.Router();

async function scrapeProductIDs(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Set timeout to 60 seconds

    await page.waitForFunction(
      'typeof window.fiboFiltersData !== "undefined" && window.fiboFiltersData.base_products_ids.length > 0',
      { timeout: 60000 }
    ); // Wait for fiboFiltersData to be defined and contain product IDs

    const productIDs = await page.evaluate(() => {
      const fiboFiltersData = window.fiboFiltersData || {};
      return fiboFiltersData.base_products_ids || [];
    });

    return productIDs;
  } catch (error) {
    console.error(`Error in scrapeProductIDs for ${url}:`, error);
    return [];
  }
}

async function scrapeProduct(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    const product = await page.evaluate(() => {
      const titleElement = document.querySelector("h1.product_title");
      const priceElement = document.querySelector("p.price");
      const imageElement = document.querySelector(
        ".woocommerce-product-gallery__image img"
      );
      const descriptionElement = document.querySelector(
        "div.woocommerce-product-details__short-description"
      );
      const descriptionTable = descriptionElement
        ? descriptionElement.querySelector("table tbody")
        : null;

      const name = titleElement ? titleElement.textContent.trim() : "N/A";
      const image = imageElement ? imageElement.src : null;

      let price = "N/A";
      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        const priceParts = priceText.split("Şu andaki fiyat");

        if (priceParts.length > 1) {
          let rawPrice = priceParts[1].trim();
          rawPrice = rawPrice.replace(/[^\d,]/g, "").replace(",", ".");

          let numericPrice = parseFloat(rawPrice);

          // Check if the numericPrice is a valid number
          if (!isNaN(numericPrice)) {
            if (Number.isInteger(numericPrice)) {
              price = numericPrice;
            } else {
              const [integerPart, decimalPart] = rawPrice.split(".");
              if (decimalPart === "00") {
                price = parseInt(integerPart);
              } else {
                price = numericPrice;
              }
            }
          } else {
            price = 0;
          }
        }
      }

      let description = [];
      if (descriptionTable) {
        const rows = descriptionTable.querySelectorAll("tr");
        description = Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");
          return cells.length >= 2 ? cells[1].innerText : "";
        });
      } else if (descriptionElement) {
        description.push(descriptionElement.textContent.trim());
      }

      let features = description.join(" \\ ").split(" \\ ");

      const tempCpu =
        features.find(
          (x) =>
            x.toLowerCase().includes("ryzen") ||
            x.toLowerCase().includes("core") ||
            x.toLowerCase().includes("İŞLEMCİ".toLowerCase()) ||
            x.toLowerCase().includes("ISLEMCI".toLowerCase())
        ) || "N/A";

      const specs = {
        CPU: tempCpu,
        Motherboard:
          features.find((x) => x.toLowerCase().includes("anakart")) || "N/A",
        GPU:
          features.find((x) => x.toLowerCase().includes("ekran kartı")) ||
          "N/A",
        Ram: features.find((x) => x.toLowerCase().includes("ram")) || "N/A",
        Case: features.find((x) => x.toLowerCase().includes("kasa")) || "N/A",
        Storage: features.find((x) => x.toLowerCase().includes("ssd")) || "N/A",
      };

      return {
        name,
        price,
        specs,
        image,
        store: "gamingGen",
      };
    });

    return { link: url, ...product };
  } catch (error) {
    console.error(`Error in scrapeProduct for ${url}:`, error);
    return null;
  }
}

async function scrapeProductsFromFile(filePath) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const links = await fs.readFile(filePath, "utf-8");
    const urls = links.split("\n").filter(Boolean);

    const results = [];
    for (const url of urls) {
      const product = await scrapeProduct(page, url);
      if (product) {
        results.push(product);
      }
    }

    await browser.close();
    await fs.writeFile("../../products.json", JSON.stringify(results, null, 2)); // Changed path to save two levels up
    console.log("Scraping completed. Results saved to products.json");
  } catch (error) {
    console.error("Error in scrapeProductsFromFile:", error);
  }
}

router.get("/", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = "https://www.gaming.gen.tr/kategori/hazir-sistemler/";

  console.log("Page loaded, starting to scrape product IDs.");

  const productIDs = await scrapeProductIDs(page, url);
  const productURLs = productIDs.map(
    (id) => `https://www.gaming.gen.tr/urun/${id}`
  );

  const results = [];
  for (const productUrl of productURLs.slice(0, 5)) {
    const product = await scrapeProduct(page, productUrl);
    if (product) {
      results.push(product);
    }
  }

  await browser.close();

  console.log("Scraping finished, sending response.");

  res.json(results);
});

export default router;

// If you need to run the file scraping separately, uncomment the following line
// scrapeProductsFromFile("product_links.txt");
