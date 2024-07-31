import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

/**
 * @swagger
 * /api/getAll:
 *   get:
 *     summary: Get all data from mock.json
 *     description: Returns the contents of mock.json file.
 *     responses:
 *       200:
 *         description: Successfully retrieved data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Item 1
 *       500:
 *         description: Failed to read mock data
 */
router.get("/", (req, res) => {
  const mockFilePath = path.join(process.cwd(), "mock.json");
  fs.readFile(mockFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read mock data" });
    }
    res.json(JSON.parse(data));
  });
});

export default router;
