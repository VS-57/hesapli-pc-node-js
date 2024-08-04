import fs from "fs/promises";
import puppeteer from "puppeteer";

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
        price = priceText.split("Şu andaki fiyat")[1] || "N/A";
        price = parseFloat(price.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
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
    for (const url of urls.slice) {
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

scrapeProductsFromFile("product_links.txt");
