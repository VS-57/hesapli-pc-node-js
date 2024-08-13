import express from "express";
const router = express.Router();
import { promises as fs } from "fs";
import mysql from "mysql2/promise"; // mysql2 paketini kullanıyoruz
import dbConfig from "../config.mjs";

router.get("/", async (req, res) => {
  try {
    const productList = JSON.parse(
      await fs.readFile("mock_test.json", "utf-8")
    );

    await fs.writeFile(
      "mock_test.json",
      JSON.stringify(
        [
          {
            name: "AFK-MD IV",
            price: 24499.29,
            image: "https://img-itopya.mncdn.com/cdn/250/afk-md-iv-19b882.png",
            link: "https://www.itopya.com/afk-md-iv-amd-ryzen-5-5600-asus-radeon-rx-6600-dual-v2-8gb-16gb-ddr4-512gb-nvme-m2-ssd-am_h26603",
            specs: {
              CPU: "AMD-Ryzen 5 5600 İşlemci",
              Motherboard: "ASUS-AMD A520 Anakart",
              GPU: "ASUS-Radeon RX 6600 Ekran Kartı",
              Ram: "GOODRAM-8GB x 2 RAM",
              Storage: "GOODRAM-512GB,M.2  2280 SSD",
            },
            store: "itopya",
          },
        ],
        null,
        2
      )
    );

    res.json(productList);
  } catch (error) {
    console.error("Error reading or processing the file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
