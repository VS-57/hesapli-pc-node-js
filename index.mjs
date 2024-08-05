import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import gameGarajRouter from "./routes/gameGaraj.mjs";
import gamingGenRouter from "./routes/gamingGen.mjs";
import itopyaRouter from "./routes/itopya.mjs";
import pckolikRouter from "./routes/pckolik.mjs";
import vatanRouter from "./routes/vatan.mjs";
import sinerjiRouter from "./routes/sinerji.mjs";
import tebilonRouter from "./routes/tebilon.mjs";
import inceHesapRouter from "./routes/inceHesap.mjs";
import getAllRouter from "./routes/getAll.mjs";
import getCPUs from "./hardwares/cpus.mjs";
import getGPUs from "./hardwares/gpus.mjs";

import setupSwagger from "./swagger/swagger.mjs";
import fetch from "node-fetch";
import { promises as fs } from "fs"; // Importing fs.promises

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Statik dosyalar için public dizinini sun
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.use("/api/game-garaj", gameGarajRouter);
app.use("/api/gaming-gen", gamingGenRouter);
app.use("/api/itopya", itopyaRouter);
app.use("/api/pckolik", pckolikRouter);
app.use("/api/vatan", vatanRouter);
app.use("/api/sinerji", sinerjiRouter);
app.use("/api/tebilon", tebilonRouter);
app.use("/api/inceHesap", inceHesapRouter);
app.use("/api/getAll", getAllRouter);
app.use("/api/cpu", getCPUs);
app.use("/api/gpu", getGPUs);

// Yeni endpoint
app.get("/api/combined", async (req, res) => {
  try {
    const urls = [
      "http://localhost:3000/api/itopya",
      "http://localhost:3000/api/pckolik",
      "http://localhost:3000/api/vatan",
      "http://localhost:3000/api/sinerji",
      "http://localhost:3000/api/inceHesap",
      "http://localhost:3000/api/game-garaj",
    ];

    const fetchPromises = urls.map((url) =>
      fetch(url).then((response) => response.json())
    );

    const results = await Promise.all(fetchPromises);
    const combinedResults = results.flat();

    const products = JSON.parse(await fs.readFile("mock.json", "utf-8"));
    const gamingGenProducts = JSON.parse(
      await fs.readFile("products.json", "utf-8")
    );

    const updatedArr = [...combinedResults, ...gamingGenProducts];

    await fs.writeFile("mock.json", JSON.stringify(updatedArr, null, 2));

    res.json(updatedArr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

setupSwagger(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/api-docs`);
});
