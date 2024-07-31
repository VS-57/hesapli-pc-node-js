import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';

const router = express.Router();
async function scrapeProduct(page, url) {
    try {
        console.log(`Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        const product = await page.evaluate(() => {
            const urunBasligiEleman = document.querySelector('h1.product_title');
            const urunFiyatiEleman = document.querySelector('p.price');
            const urunAciklamasiEleman = document.querySelector('div.woocommerce-product-details__short-description');

            const urunBasligi = urunBasligiEleman ? urunBasligiEleman.textContent.trim() : 'N/A';

            let urunFiyati = 'N/A';
            if (urunFiyatiEleman) {
                const fiyat = urunFiyatiEleman.textContent.trim();
                urunFiyati = fiyat.split("Şu andaki fiyat")[1] || 'N/A';
            }

            const urunAciklamasi = urunAciklamasiEleman ? urunAciklamasiEleman.textContent.trim() : 'N/A';

            return {
                title: urunBasligi,
                price: urunFiyati,
                description: urunAciklamasi
            };
        });

        return { url, ...product };
    } catch (error) {
        console.error(`Error in scrapeProduct for ${url}:`, error);
        return null;
    }
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function clickFibofiltersButton(page) {
    const buttons = await page.$$('button.fibofilters-button.fibofilters-show-more');
    console.log(`Found ${buttons.length} buttons`);

    if (/* buttons.length > 0 */ false) {
        for (const button of buttons) {
            console.log('Clicking button');
            await button.click();
            await delay(10000); // 10 saniye bekle
        }
    } else {
        console.log('No more buttons to click, checking product links');
        await delay(15000); // 15 saniye bekle
        const productLinks = await checkProductLinks(page);

        const linesToRemove = []; // Silinmesi gereken satırları buraya ekleyin
        const products = [];

        for (const productUrl of productLinks) {
            const product = await scrapeProduct(page, productUrl);

            if (product) {
                const cleanedDescription = product.description.replace(/\n\s*\n/g, '\n').trim();
                const lines = cleanedDescription.split('\n');
                const filteredLines = lines.filter(line => !linesToRemove.includes(line.trim()) && line.trim());

                const productDict = {};
                for (let i = 0; i < filteredLines.length; i += 2) {
                    if (i + 1 < filteredLines.length) {
                        productDict[filteredLines[i].trim()] = filteredLines[i + 1].trim();
                    }
                }

                products.push({
                    link: productUrl,
                    name: product.title,
                    price: product.price,
                    /* description: productDict */
                });
            }
        }

        return products;
    }

    return [];
}

async function checkProductLinks(page) {
    const productLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a.woocommerce-LoopProduct-link');
        return Array.from(links).map(link => link.href);
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
router.get('/', async (req, res) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.gaming.gen.tr/kategori/hazir-sistemler/', { waitUntil: 'networkidle2' });
    const products = await clickFibofiltersButton(page);
    await browser.close();
    res.json(products);
});

export default router;
