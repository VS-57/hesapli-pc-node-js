import { Router } from "express";
import fetch from "node-fetch";
import { MongoClient } from "mongodb";

const router = Router();

// MongoDB connection details
const mongoUrl = "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const productsCollectionName = "products";
const gamingGenCollectionName = "gamingGen";

router.get("/", async (req, res) => {
  let client;

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const productsCollection = db.collection(productsCollectionName);
    const gamingGenCollection = db.collection(gamingGenCollectionName);

    const urls = [
      "http://localhost:3000/api/itopya",
      "http://localhost:3000/api/pckolik",
      "http://localhost:3000/api/vatan",
      "http://localhost:3000/api/inceHesap",
      /* "http://localhost:3000/api/gaming-gen", */
      "http://localhost:3000/api/game-garaj",
      "http://localhost:3000/api/tebilon",
      "http://localhost:3000/api/gencergaming",
    ];

    const fetchWithTimeout = async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 dakika

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error fetching from ${url}:`, error.message);
        return null; // Hata durumunda null döndür
      }
    };

    // Diğer tüm URL'ler için fetch işlemi
    const fetchPromises = urls.map((url) => fetchWithTimeout(url));

    // Sinerji için ayrı fetch işlemi
    const sinerjiUrl = "http://localhost:3000/api/sinerji";
    const sinerjiPromise = fetchWithTimeout(sinerjiUrl);

    // Tüm diğer verileri al
    const results = await Promise.allSettled(fetchPromises);
    const combinedResults = results
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null
      )
      .flatMap((result) => result.value);

    // Gaming Gen ürünlerini MongoDB'den çek
    const gamingGenProducts = await gamingGenCollection.find().toArray();

    // Sinerji verisini al ve diğer sonuçlara ekle
    const sinerjiData = await sinerjiPromise;
    if (Array.isArray(sinerjiData)) {
      combinedResults.push(...sinerjiData);
    }

    const updatedArr = [...combinedResults, ...gamingGenProducts];

    // Her bir ürünü `id`'ye göre güncelle veya ekle
    await Promise.all(updatedArr.map(async (item) => {
      const { _id, ...itemWithoutId } = item; // _id alanını hariç tut

      await productsCollection.updateOne(
        { id: item.id }, // Benzersiz alanı burada belirleyin
        { $set: itemWithoutId }, // _id olmadan set işlemi
        { upsert: true } // Yoksa ekle, varsa güncelle
      );
    }));

    res.json(updatedArr);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message });
  } finally {
    // MongoDB connection'ı kapat
    if (client) {
      await client.close();
    }
  }
});

export default router;
