import { Router } from "express";
import fetch from "node-fetch";
import { promises as fs } from "fs";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const urls = [
      "http://localhost:3000/api/pckolik",
      "http://localhost:3000/api/vatan",
      "http://localhost:3000/api/inceHesap",
      "http://localhost:3000/api/game-garaj",
      "http://localhost:3000/api/tebilon",
      "http://localhost:3000/api/gencergaming",
    ];

    const fetchWithTimeout = async (url, timeout = 240000) => { // Default timeout is 4 minutes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error fetching from ${url}:`, error.message);
        return null; // Return null in case of an error
      }
    };

    // Separate fetch for itopya with a minimum 60 seconds delay
    const fetchItopyaWithDelay = async () => {
      const url = "http://localhost:3000/api/itopya";
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
      return fetchWithTimeout(url, 240000); // Timeout for 4 minutes
    };

    // Retry logic for Sinerji fetch
    const fetchSinerjiWithRetry = async (retries = 3, timeout = 240000) => {
      const url = "http://localhost:3000/api/sinerji";
      for (let i = 0; i < retries; i++) {
        const sinerjiData = await fetchWithTimeout(url, timeout);
        if (sinerjiData) {
          return sinerjiData;
        }
        console.warn(`Retrying fetch for Sinerji (${i + 1}/${retries})...`);
      }
      console.error("Failed to fetch Sinerji data after retries");
      return null; // Return null if all retries fail
    };

    // Fetch data from other URLs concurrently
    const fetchPromises = urls.map(url => fetchWithTimeout(url));

    // Fetch Sinerji data with retry logic
    const sinerjiPromise = fetchSinerjiWithRetry();

    // Fetch Itopya data with delay
    const itopyaPromise = fetchItopyaWithDelay();

    // Wait for all promises to settle
    const [itopyaResult, sinerjiResult, ...otherResults] = await Promise.allSettled([
      itopyaPromise,
      sinerjiPromise,
      ...fetchPromises
    ]);

    // Combine results, filter fulfilled, and merge into a single array
    const combinedResults = [
      ...otherResults
        .filter(result => result.status === "fulfilled" && result.value !== null)
        .flatMap(result => result.value),
      ...(itopyaResult.status === "fulfilled" && itopyaResult.value ? itopyaResult.value : []),
      ...(sinerjiResult.status === "fulfilled" && Array.isArray(sinerjiResult.value) ? sinerjiResult.value : [])
    ];

    // Add Gaming Gen products from file
    const gamingGenProducts = JSON.parse(await fs.readFile("products.json", "utf-8"));
    combinedResults.push(...gamingGenProducts);

    // Write the combined data to mock.json
    await fs.writeFile("mock.json", JSON.stringify(combinedResults, null, 2));

    res.json(combinedResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
