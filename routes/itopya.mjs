import express from 'express';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const router = express.Router();

async function fetchPageData(page) {
    const response = await fetch(`https://www.itopya.com/HazirSistemler?pg=${page}`);
    const text = await response.text();
    const dom = new JSDOM(text);
    return dom.window.document;
}

function parseProducts(doc) {
    const productElements = doc.querySelectorAll('.product');
    return Array.from(productElements).map(product => {
        const brandImage = product.querySelector('.brand img').getAttribute('data-src');
        const productImage = product.querySelector('.product-header .image img').getAttribute('data-src');
        const title = product.querySelector('.title').textContent.trim();
        const link = product.querySelector('.title').getAttribute('href');
        const price = product.querySelector('.price strong').textContent.trim();
        const specs = Array.from(product.querySelectorAll('.product-body ul li')).map(li => ({
            specIcon: li.querySelector('img').getAttribute('src'),
            specText: li.querySelector('p').textContent.trim()
        }));
        return { brandImage, productImage, title, link, price, specs };
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
 * /api/itopya:
 *   get:
 *     summary: Get all products from Itopya
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
 *                   brandImage:
 *                     type: string
 *                   productImage:
 *                     type: string
 *                   title:
 *                     type: string
 *                   link:
 *                     type: string
 *                   price:
 *                     type: string
 *                   specs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         specIcon:
 *                           type: string
 *                         specText:
 *                           type: string
 */
router.get('/', async (req, res) => {
    try {
        const totalPages = 24;
        const products = await fetchAllProducts(totalPages);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
