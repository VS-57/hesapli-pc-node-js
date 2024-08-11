import express from "express";
const router = express.Router();
import { promises as fs } from "fs";

const GPUs = [
  // NVIDIA GeForce GPUs
  { name: "GeForce GTX 1030", value: "GTX 1030" },
  { name: "GeForce GTX 1050", value: "GTX 1050" },
  { name: "GeForce GTX 1050 Ti", value: "GTX 1050 Ti" },
  { name: "GeForce GTX 1060", value: "GTX 1060" },
  { name: "GeForce GTX 1070", value: "GTX 1070" },
  { name: "GeForce GTX 1070 Ti", value: "GTX 1070 Ti" },
  { name: "GeForce GTX 1080", value: "GTX 1080" },
  { name: "GeForce GTX 1080 Ti", value: "GTX 1080 Ti" },

  { name: "GeForce GTX 1630", value: "GTX 1630" },
  { name: "GeForce GTX 1650", value: "GTX 1650" },
  { name: "GeForce GTX 1650 Super", value: "GTX 1650 Super" },
  { name: "GeForce GTX 1660", value: "GTX 1660" },
  { name: "GeForce GTX 1660 Super", value: "GTX 1660 Super" },
  { name: "GeForce GTX 1660 Ti", value: "GTX 1660 Ti" },

  { name: "GeForce RTX 2060", value: "RTX 2060" },
  { name: "GeForce RTX 2060 Super", value: "RTX 2060 Super" },
  { name: "GeForce RTX 2070", value: "RTX 2070" },
  { name: "GeForce RTX 2070 Super", value: "RTX 2070 Super" },
  { name: "GeForce RTX 2080", value: "RTX 2080" },
  { name: "GeForce RTX 2080 Super", value: "RTX 2080 Super" },
  { name: "GeForce RTX 2080 Ti", value: "RTX 2080 Ti" },

  { name: "GeForce RTX 3050", value: "RTX 3050" },
  { name: "GeForce RTX 3060", value: "RTX 3060" },
  { name: "GeForce RTX 3060 Ti", value: "RTX 3060 Ti" },
  { name: "GeForce RTX 3070", value: "RTX 3070" },
  { name: "GeForce RTX 3070 Ti", value: "RTX 3070 Ti" },
  { name: "GeForce RTX 3080", value: "RTX 3080" },
  { name: "GeForce RTX 3080 Ti", value: "RTX 3080 Ti" },
  { name: "GeForce RTX 3090", value: "RTX 3090" },
  { name: "GeForce RTX 3090 Ti", value: "RTX 3090 Ti" },

  { name: "GeForce RTX 4060", value: "RTX 4060" },
  { name: "GeForce RTX 4060 Ti", value: "RTX 4060 Ti" },
  { name: "GeForce RTX 4070", value: "RTX 4070" },
  { name: "GeForce RTX 4070 Ti", value: "RTX 4070 Ti" },
  { name: "GeForce RTX 4070 Super", value: "RTX 4070 Super" },
  { name: "GeForce RTX 4070 Ti Super", value: "RTX 4070 Ti Super" },
  { name: "GeForce RTX 4080", value: "RTX 4080" },
  { name: "GeForce RTX 4080 Super", value: "RTX 4080 Super" },
  { name: "GeForce RTX 4090", value: "RTX 4090" },

  // AMD Radeon GPUs
  { name: "Radeon RX 460", value: "RX 460" },
  { name: "Radeon RX 470", value: "RX 470" },
  { name: "Radeon RX 480", value: "RX 480" },
  { name: "Radeon RX 550", value: "RX 550" },
  { name: "Radeon RX 560", value: "RX 560" },
  { name: "Radeon RX 570", value: "RX 570" },
  { name: "Radeon RX 580", value: "RX 580" },
  { name: "Radeon RX 590", value: "RX 590" },

  { name: "Radeon RX 5500 XT", value: "RX 5500 XT" },
  { name: "Radeon RX 5600 XT", value: "RX 5600 XT" },
  { name: "Radeon RX 5700", value: "RX 5700" },
  { name: "Radeon RX 5700 XT", value: "RX 5700 XT" },
  { name: "Radeon RX 6300", value: "RX 6300" },
  { name: "Radeon RX 6400", value: "RX 6400" },
  { name: "Radeon RX 6500 XT", value: "RX 6500 XT" },
  { name: "Radeon RX 6600", value: "RX 6600" },
  { name: "Radeon RX 6600 XT", value: "RX 6600 XT" },
  { name: "Radeon RX 6650 XT", value: "RX 6650 XT" },

  { name: "Radeon RX 6700", value: "RX 6700" },
  { name: "Radeon RX 6700 XT", value: "RX 6700 XT" },
  { name: "Radeon RX 6750 XT", value: "RX 6750 XT" },
  { name: "Radeon RX 6800", value: "RX 6800" },
  { name: "Radeon RX 6800 XT", value: "RX 6800 XT" },
  { name: "Radeon RX 6900 XT", value: "RX 6900 XT" },
  { name: "Radeon RX 6950 XT", value: "RX 6950 XT" },

  { name: "Radeon RX 7600", value: "RX 7600" },
  { name: "Radeon RX 7600 XT", value: "RX 7600 XT" },
  { name: "Radeon RX 7700 XT", value: "RX 7700 XT" },
  { name: "Radeon RX 7800 XT", value: "RX 7800 XT" },
  { name: "Radeon RX 7900 GRE", value: "RX 7900 GRE" },
  { name: "Radeon RX 7900 XT", value: "RX 7900 XT" },
  { name: "Radeon RX 7900 XTX", value: "RX 7900 XTX" },

  // Intel ARC GPUs
  { name: "Intel ARC 310", value: "ARC 310" },
  { name: "Intel ARC 380", value: "ARC 380" },
  { name: "Intel ARC 580", value: "ARC 580" },
  { name: "Intel ARC 750", value: "ARC 750" },
  { name: "Intel ARC 770", value: "ARC 770" },
];

router.get("/", async (req, res) => {
  try {
    const productList = JSON.parse(await fs.readFile("mock.json", "utf-8"));

    const filteredGPUList = GPUs.filter((gpu) => {
      // Check if there is at least one product that matches the CPU criteria
      return productList.some((item) => {
        const itemGPU = item.specs?.GPU?.toLowerCase() || "";

        return itemGPU.includes(gpu.value.trim().toLowerCase());
      });
    });

    // Return the filtered GPU list
    res.json(filteredGPUList);
  } catch (error) {
    console.error("Error reading or processing the file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
