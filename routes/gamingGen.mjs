import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';

const router = express.Router();

async function scrapeProduct(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const product = await page.evaluate(() => {
            const titleElement = document.querySelector('h1.product_title');
            const priceElement = document.querySelector('p.price');
            const descriptionElement = document.querySelector('div.woocommerce-product-details__short-description');
            return {
                title: titleElement ? titleElement.textContent.trim() : 'N/A',
                price: priceElement ? priceElement.textContent.split("Şu andaki fiyat")[1]?.trim() : 'N/A',
                description: descriptionElement ? descriptionElement.textContent.trim() : 'N/A'
            };
        });
        return { url, ...product };
    } catch (error) {
        console.error(`Error in scrapeProduct for ${url}:`, error);
        return null;
    }
}

async function clickFibofiltersButton(page) {
    const buttons = await page.$$('button.fibofilters-button.fibofilters-show-more');
    if (buttons.length > 0) {
        for (const button of buttons) {
            await button.click();
            await page.waitForTimeout(10000);
        }
    } else {
        await page.waitForTimeout(15000);
        const productLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('a.woocommerce-LoopProduct-link');
            return Array.from(links).map(link => link.href);
        });
        const products = [];
        for (const productUrl of productLinks) {
            const product = await scrapeProduct(page, productUrl);
            if (product) products.push(product);
        }
        return products;
    }
    return [];
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
