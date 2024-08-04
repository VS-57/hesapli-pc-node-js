import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";

const router = express.Router();

async function scrapeProduct(page, url) {
  try {
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    const product = await page.evaluate(() => {
      const titleElement = document.querySelector("h1.product_title");
      const priceElement = document.querySelector("p.price");
      const imageElement = document.querySelector(".woocommerce-product-gallery__image img");
      const descriptionElement = document.querySelector("div.woocommerce-product-details__short-description");
      const descriptionTable = descriptionElement ? descriptionElement.querySelector("table tbody") : null;

      const title = titleElement ? titleElement.textContent.trim() : "N/A";
      const image = imageElement ? imageElement.src : null;

      let price = "N/A";
      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        price = priceText.split("Şu andaki fiyat")[1] || "N/A";
        price = parseFloat(price.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
      }

      let description = "N/A";
      if (descriptionTable) {
        const rows = descriptionTable.querySelectorAll("tr");
        description = Array.from(rows).map((row) => {
          const cells = row.querySelectorAll("td");
          return cells.length >= 2 ? { "": cells[1].innerText } : {};
        });
      } else if (descriptionElement) {
        description = descriptionElement.textContent.trim();
      }

      return {
        title,
        price,
        description,
        image,
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
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      await page.waitForSelector("button.fibofilters-button.fibofilters-show-more", { timeout: 15000 });

      const placeholderImages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img")).filter(
          img => img.src === "https://www.gaming.gen.tr/wp-content/uploads/woocommerce-placeholder-300x300.jpg"
        ).length;
      });

      console.log(`Found ${placeholderImages} placeholder images`);

      if (placeholderImages > 0) {
        console.log(`Waiting for placeholder images to load... Attempt ${attempts + 1}`);
        await delay(10000);
        attempts++;
        continue;
      }

      const buttons = await page.$$("button.fibofilters-button.fibofilters-show-more");
      console.log(`Found ${buttons.length} buttons`);

      if (buttons.length > 0) {
        for (const button of buttons) {
          console.log("Clicking button");
          await button.click();
          buttonsFound++;
          await delay(10000);
        }
      } else {
        break;
      }
    } catch (error) {
      console.error("Error clicking buttons or no more buttons found:", error);

      const htmlContent = await page.content();
      fs.writeFileSync("debug.html", htmlContent);
      console.log("Saved page content to debug.html for inspection.");

      try {
        await delay(5000);
        await page.waitForSelector("button.fibofilters-button.fibofilters-show-more", { timeout: 15000 });
      } catch (retryError) {
        console.error("Retrying failed:", retryError);
        break;
      }
    }
  }

  console.log(`Clicked a total of ${buttonsFound} buttons`);

  await delay(15000);
  const productLinks = await checkProductLinks(page);

  const linesToRemove = [];
  const products = [];

  for (const productUrl of productLinks) {
    const product = await scrapeProduct(page, productUrl);

    if (product) {
      const cleanedDescription = product.description.replace(/\n\s*\n/g, "\n").trim();
      const lines = cleanedDescription.split("\n");
      const filteredLines = lines.filter((line) => !linesToRemove.includes(line.trim()) && line.trim());
      const removedLines = filteredLines.slice(1, filteredLines.length);

      products.push({
        url: productUrl,
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
        store: "gamingGen",
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

router.get("/", async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.gaming.gen.tr/kategori/hazir-sistemler/", { waitUntil: "networkidle2" });

  console.log("Page loaded, starting button click process.");

  const products = await clickFibofiltersButton(page);
  await browser.close();

  console.log("Scraping finished, sending response.");

  res.json(products);
});

export default router;
