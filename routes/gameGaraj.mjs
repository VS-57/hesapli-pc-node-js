import express from 'express';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const router = express.Router();

async function fetchPageData(page) {
    const response = await fetch(`https://www.gamegaraj.com/grup/masaustu-bilgisayar/page/${page}/`);
    const text = await response.text();
    const dom = new JSDOM(text);
    return dom.window.document;
}

function parseProducts(doc) {
    const productElements = doc.querySelectorAll('.products li.product');
    return Array.from(productElements).map(product => {
        const imageElement = product.querySelector('.edgtf-pl-image img');
        const titleElement = product.querySelector('.edgtf-product-list-title a');
        const priceElement = product.querySelector('.price ins .woocommerce-Price-amount');
        return {
            image: imageElement ? imageElement.getAttribute('src') : null,
            title: titleElement ? titleElement.textContent.trim() : null,
            price: priceElement ? priceElement.textContent.trim() : null,
            link: titleElement ? titleElement.getAttribute('href') : null
        };
    });
}

async function fetchAllProducts(totalPages) {
    let allProducts = [];
    for (let page = 1; page <= totalPages; page++) {
        const doc = await fetchPageData(page);
        const products = parseProducts(doc);
        allProducts = allProducts.concat(products);
    }
    return allProducts;
}

/**
 * @swagger
 * /api/game-garaj:
 *   get:
 *     summary: Get all products from Game Garaj
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
 *                   image:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: string
 *                   link:
 *                     type: string
 */
router.get('/', async (req, res) => {
    try {
        const totalPages = 8; // Total page number
        const products = await fetchAllProducts(totalPages);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
