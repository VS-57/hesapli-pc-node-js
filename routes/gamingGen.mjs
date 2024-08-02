import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";

const router = express.Router();

async function scrapeProduct(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    const product = await page.evaluate(() => {
      const urunBasligiEleman = document.querySelector("h1.product_title");
      const urunFiyatiEleman = document.querySelector("p.price");
      const imageElement = document.querySelector(
        ".woocommerce-product-gallery__image img"
      );

      const urunAciklamasiEleman = document.querySelector(
        "div.woocommerce-product-details__short-description"
      );
      const urunAciklamasiTable = urunAciklamasiEleman
        ? urunAciklamasiEleman.querySelector("table tbody")
        : null;

      const urunBasligi = urunBasligiEleman
        ? urunBasligiEleman.textContent.trim()
        : "N/A";

      const image = imageElement ? imageElement.src : null;

      let urunFiyati = "N/A";
      if (urunFiyatiEleman) {
        const fiyat = urunFiyatiEleman.textContent.trim();
        urunFiyati = fiyat.split("Şu andaki fiyat")[1] || "N/A";
        urunFiyati =
          parseFloat(urunFiyati.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
      }

      let urunAciklamasi = "N/A";
      if (urunAciklamasiTable) {
        const trs = urunAciklamasiTable.querySelectorAll("tr");
        urunAciklamasi = Array.from(trs).map((row, index) => {
          const tds = row.querySelectorAll("td");
          let rowObject = {};
          if (tds.length >= 2) {
            rowObject = {
              "": tds[1].innerText,
            };
          }
          return rowObject;
        });
      } else if (urunAciklamasiEleman) {
        urunAciklamasi = urunAciklamasiEleman.textContent.trim();
      }

      return {
        title: urunBasligi,
        price: urunFiyati,
        description: urunAciklamasi,
        image: image,
      };
    });

    if (Array.isArray(product.description)) {
      product.description = product.description
        .map((item) => {
          const key = Object.keys(item)[0];
          const value = item[key];
          return `${key}: ${value}`;
        })
        .join("\n");
    }

    return { url, ...product };
  } catch (error) {
    console.error(`Error in scrapeProduct for ${url}:`, error);
    return null;
  }
}

async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function clickFibofiltersButton(page) {
  let buttonsFound = 0;
  while (true) {
    try {
      // Wait for the button to appear
      await page.waitForSelector(
        "button.fibofilters-button.fibofilters-show-more",
        { timeout: 15000 }
      );
      const buttons = await page.$$(
        "button.fibofilters-button.fibofilters-show-more"
      );
      console.log(`Found ${buttons.length} buttons`);

      if (buttons.length > 0) {
        for (const button of buttons) {
          console.log("Clicking button");
          await button.click();
          buttonsFound++;
          await delay(10000); // Wait for 10 seconds
        }
      } else {
        break;
      }
    } catch (error) {
      console.error("Error clicking buttons or no more buttons found:", error);

      // Capture HTML content for debugging
      const htmlContent = await page.content();
      fs.writeFileSync("debug.html", htmlContent);
      console.log("Saved page content to debug.html for inspection.");

      // Retry mechanism
      try {
        await delay(5000); // Wait for 5 seconds before retrying
        await page.waitForSelector(
          "button.fibofilters-button.fibofilters-show-more",
          { timeout: 15000 }
        );
      } catch (retryError) {
        console.error("Retrying failed:", retryError);
        break; // Exit the loop if retrying fails
      }
    }
  }

  console.log(`Clicked a total of ${buttonsFound} buttons`);

  await delay(15000); // Wait for 15 seconds
  const productLinks = await checkProductLinks(page);

  const linesToRemove = []; // Add lines to remove here
  const products = [];

  for (const productUrl of productLinks) {
    const product = await scrapeProduct(page, productUrl);

    if (product) {
      const cleanedDescription = product.description
        .replace(/\n\s*\n/g, "\n")
        .trim();
      const lines = cleanedDescription.split("\n");
      const filteredLines = lines.filter(
        (line) => !linesToRemove.includes(line.trim()) && line.trim()
      );
      const removedLines = filteredLines.slice(1, filteredLines.length);

      products.push({
        link: productUrl,
        name: product.title,
        price: product.price,
        image: product.image,
        specs: {
          CPU: removedLines[0] || "N/A",
          Motherboard: removedLines[1] || "N/A",
          GPU: removedLines[2] || "N/A",
          Ram: removedLines[3] || "N/A",
          Storage: removedLines[4] || "N/A",
          Case: removedLines[5] || "N/A",
        },
      });
    }
  }

  return products;
}

async function checkProductLinks(page) {
  const productLinks = await page.evaluate(() => {
    const links = document.querySelectorAll("a.woocommerce-LoopProduct-link");
    return Array.from(links).map((link) => link.href);
  });
  console.log(`Found ${productLinks.length} product links.`);
  return productLinks;
}

/**
 * @swagger
 * /api/gaming-gen:
 *   get:
 *     summary: Get all products from Gaming Gen
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: string
 *                   description:
 *                     type: string
 */
router.get("/", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.gaming.gen.tr/kategori/hazir-sistemler/", {
    waitUntil: "networkidle2",
  });

  console.log("Page loaded, starting button click process.");

  const products = await clickFibofiltersButton(page);
  await browser.close();

  console.log("Scraping finished, sending response.");

  res.json(products);
});

export default router;
