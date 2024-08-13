import { Router } from "express";
import fetch from "node-fetch";
import { promises as fs } from "fs";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const urls = [
      "https://ucuzasistem.com/api/itopya",
      "https://ucuzasistem.com/api/pckolik",
      "https://ucuzasistem.com/api/vatan",
      "https://ucuzasistem.com/api/inceHesap",
      /* "https://ucuzasistem.com/api/gaming-gen", */
      "https://ucuzasistem.com/api/game-garaj",
      "https://ucuzasistem.com/api/tebilon",
      "https://ucuzasistem.com/api/gencergaming",
    ];

    // Diğer tüm URL'ler için fetch işlemi
    const fetchPromises = urls.map((url) =>
      fetch(url)
        .then((response) => response.json())
        .catch((error) => {
          console.error(`Error fetching from ${url}:`, error.message);
          return null; // Hata durumunda null döndür
        })
    );

    // Sinerji için ayrı fetch işlemi
    const sinerjiUrl = "https://ucuzasistem.com/api/sinerji";
    const sinerjiPromise = fetch(sinerjiUrl)
      .then((response) => response.json())
      .catch((error) => {
        console.error(`Error fetching from ${sinerjiUrl}:`, error.message);
        return null; // Hata durumunda null döndür
      });

    // Tüm diğer verileri al
    const results = await Promise.allSettled(fetchPromises);
    const combinedResults = results
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null
      )
      .flatMap((result) => result.value);

    // Gaming Gen ürünlerini ekle
    const gamingGenProducts = JSON.parse(
      await fs.readFile("products.json", "utf-8")
    );

    // Sinerji verisini al ve diğer sonuçlara ekle
    const sinerjiData = await sinerjiPromise;
    if (Array.isArray(sinerjiData)) {
      combinedResults.push(...sinerjiData);
    }

    const updatedArr = [...combinedResults, ...gamingGenProducts];

    await fs.writeFile("mock.json", JSON.stringify(updatedArr, null, 2));

    res.json(updatedArr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
