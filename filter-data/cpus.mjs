import express from "express";
const router = express.Router();
import { promises as fs } from "fs";

const CPUs = [
  // Ryzen 3
  { name: "Ryzen 3 1200", value: " 1200 " },
  { name: "Ryzen 3 1300X", value: "1300X " },
  { name: "Ryzen 3 2200G", value: "2200G " },
  { name: "Ryzen 3 2300X", value: "2300X " },
  { name: "Ryzen 3 3200G", value: "3200G " },
  { name: "Ryzen 3 3100", value: "3100 " },
  { name: "Ryzen 3 3300X", value: "3300X " },
  { name: "Ryzen 3 8300G", value: "8300G " },
  { name: "Ryzen 5 1400", value: "1400 " },
  { name: "Ryzen 5 1500X", value: "1500X " },
  { name: "Ryzen 5 1600", value: "1600 " },
  { name: "Ryzen 5 1600X", value: "1600X " },
  { name: "Ryzen 5 2400G", value: "2400G " },
  { name: "Ryzen 5 2600", value: "2600 " },
  { name: "Ryzen 5 2600X", value: "2600X " },
  { name: "Ryzen 5 3400G", value: "3400G " },
  { name: "Ryzen 5 3600", value: "3600 " },
  { name: "Ryzen 5 3600X", value: "3600X " },
  { name: "Ryzen 5 3600XT", value: "3600XT " },
  { name: "Ryzen 5 4300G", value: "4300G " },
  { name: "Ryzen 5 4500", value: "4500 " },
  { name: "Ryzen 5 4600G", value: "4600G " },
  { name: "Ryzen 5 4600GE", value: "4600GE " },
  { name: "Ryzen 5 5500", value: "5500 " },
  { name: "Ryzen 5 5600", value: "5600 " },
  { name: "Ryzen 5 5600X", value: "5600X " },
  { name: "Ryzen 5 5600G", value: "5600G " },
  { name: "Ryzen 5 5600GE", value: "5600GE " },
  { name: "Ryzen 5 7500F", value: "7500F " },
  { name: "Ryzen 5 7600", value: "7600 " },
  { name: "Ryzen 5 8400F", value: "8400F " },
  { name: "Ryzen 5 8500G", value: "8500G " },
  { name: "Ryzen 5 8600G", value: "8600G " },
  { name: "Ryzen 5 9600X", value: "9600X " },

  // Ryzen 7
  { name: "Ryzen 7 1700", value: "1700 " },
  { name: "Ryzen 7 1700X", value: "1700X " },
  { name: "Ryzen 7 1800X", value: "1800X " },
  { name: "Ryzen 7 2700", value: " 2700 " },
  { name: "Ryzen 7 2700X", value: "2700X " },
  { name: "Ryzen 7 3700X", value: "3700X " },
  { name: "Ryzen 7 3800X", value: "3800X " },
  { name: "Ryzen 7 3800XT", value: "3800XT " },
  { name: "Ryzen 7 5700G", value: "5700G " },
  { name: "Ryzen 7 5700X", value: "5700X " },
  { name: "Ryzen 7 5700X3D", value: "5700X3D " },
  { name: "Ryzen 7 5800X", value: "5800X " },
  { name: "Ryzen 7 5800X3D", value: "5800X3D " },
  { name: "Ryzen 7 7700X", value: "7700X " },
  { name: "Ryzen 7 7800X3D", value: "7800X3D " },
  { name: "Ryzen 7 8700F", value: "8700F " },
  { name: "Ryzen 7 8700G", value: "8700G " },
  { name: "Ryzen 7 9700X", value: "9700X " },

  // Ryzen 9
  { name: "Ryzen 9 3900X", value: "3900X " },
  { name: "Ryzen 9 3900XT", value: "3900XT " },
  { name: "Ryzen 9 3950X", value: "3950X " },
  { name: "Ryzen 9 5900X", value: "5900X " },
  { name: "Ryzen 9 5950X", value: "5950X " },
  { name: "Ryzen 9 7900X", value: "7900X " },
  { name: "Ryzen 9 7900X3D", value: "7900X3D " },
  { name: "Ryzen 9 7950X", value: "7950X " },
  { name: "Ryzen 9 7950X3D", value: "7950X3D " },
  { name: "Ryzen 9 9900X", value: "9900X " },
  { name: "Ryzen 9 9950X", value: "9950X " },

  // Intel 10th Gen Processors
  { name: "Core i3-10100", value: "10100 " },
  { name: "Core i3-10300", value: "10300 " },
  { name: "Core i3-10320", value: "10320 " },
  { name: "Core i5-10400", value: "10400 " },
  { name: "Core i5-10400F", value: "10400F " },
  { name: "Core i5-10500", value: "10500 " },
  { name: "Core i5-10600", value: "10600 " },
  { name: "Core i5-10600K", value: "10600K " },
  { name: "Core i7-10700", value: "10700 " },
  { name: "Core i7-10700K", value: "10700K " },
  { name: "Core i9-10900", value: "10900 " },
  { name: "Core i9-10900K", value: "10900K " },

  // Intel 11th Gen Processors
  { name: "Core i3-11100", value: "11100 " },
  { name: "Core i3-11300", value: "11300 " },
  { name: "Core i5-11400", value: "11400 " },
  { name: "Core i5-11500", value: "11500 " },
  { name: "Core i5-11600K", value: "11600K " },
  { name: "Core i7-11700", value: "11700 " },
  { name: "Core i7-11700K", value: "11700K " },
  { name: "Core i9-11900", value: "11900 " },
  { name: "Core i9-11900K", value: "11900K " },

  // Intel 12th Gen Processors
  { name: "Core i3-12100", value: "12100 " },
  { name: "Core i3-12100F", value: "12100F " },
  { name: "Core i3-12300", value: "12300 " },
  { name: "Core i5-12400", value: "12400 " },
  { name: "Core i5-12400F", value: "12400F " },
  { name: "Core i5-12600K", value: "12600K " },
  { name: "Core i7-12700", value: "12700 " },
  { name: "Core i7-12700K", value: "12700K " },
  { name: "Core i7-12700KF ", value: "12700KF " },
  { name: "Core i9-12900", value: "12900 " },
  { name: "Core i9-12900K", value: "12900K " },

  // Intel 13th Gen Processors
  { name: "Core i3-13100", value: "13100 " },
  { name: "Core i5-13400", value: "13400 " },
  { name: "Core i5-13400F", value: "13400F " },

  { name: "Core i5-13600K", value: "13600K " },
  { name: "Core i7-13700", value: "13700 " },
  { name: "Core i7-13700K", value: "13700K " },
  { name: "Core i9-13900", value: "13900 " },
  { name: "Core i9-13900K", value: "13900K " },

  // Intel 14th Gen Processors
  { name: "Core i3-14100", value: "14100 " },
  { name: "Core i5-14400", value: "14400 " },
  { name: "Core i5-14400F", value: "14400F " },
  { name: "Core i5-14600K", value: "14600K " },
  { name: "Core i7-14700", value: "14700 " },
  { name: "Core i7-14700K", value: "14700K " },
  { name: "Core i9-14900", value: "14900 " },
  { name: "Core i9-14900K", value: "14900K " },
];

router.get("/", async (req, res) => {
  try {
    const productList = JSON.parse(await fs.readFile("mock.json", "utf-8"));

    const filteredCPUList = CPUs.filter((cpu) => {
      // Check if there is at least one product that matches the CPU criteria
      return productList.some((item) => {
        const itemCPU = item.specs?.CPU?.toLowerCase() || "";

        return itemCPU.includes(cpu.value.trim().toLowerCase());
      });
    });

    // Return the filtered CPU list
    res.json(filteredCPUList);
  } catch (error) {
    console.error("Error reading or processing the file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
