import express from 'express';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const router = express.Router();

async function fetchAllProducts(urls) {
    const products = [];
    for (const url of urls) {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const productElements = doc.querySelectorAll('.product-list.product-list--list-page');
        productElements.forEach(productElement => {
            const nameElement = productElement.querySelector('.product-list__product-name h3');
            const priceElement = productElement.querySelector('.product-list__price');
            const imageElement = productElement.querySelector('.product-list__image-safe img');
            const name = nameElement ? nameElement.textContent.trim() : 'No name';
            const price = priceElement ? priceElement.textContent.trim().replace(/\s+/g, " ") : 'No price';
            const image = imageElement ? imageElement.getAttribute('data-src') : 'No image';
            const specs = {};
            productElement.querySelectorAll('.productlist_spec ul li p').forEach(specElement => {
                const specNameElement = specElement.querySelector('#specname');
                const specValueElement = specElement.querySelector('#specvalue');
                const specName = specNameElement ? specNameElement.textContent.trim() : 'No spec name';
                const specValue = specValueElement ? specValueElement.textContent.trim() : 'No spec value';
                specs[specName] = specValue;
            });
            products.push({ name, price, image, specs });
        });
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


/**
 * @swagger
 * /api/vatan:
 *   get:
 *     summary: Get all products from Vatan
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
 *                   name:
 *                     type: string
 *                   price:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/', async (req, res) => {
    const baseUrl = 'https://www.vatanbilgisayar.com/oem-hazir-sistemler/';
    const totalPages = 4;
    const urls = generateUrls(baseUrl, totalPages);
    try {
        const products = await fetchAllProducts(urls);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
