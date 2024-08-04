// index.mjs
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
import getAllRouter from "./routes/getAll.mjs";
import setupSwagger from "./swagger/swagger.mjs";
import fetch from "node-fetch";
import { promises as fs } from "fs"; // Importing fs.promises

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.use("/api/game-garaj", gameGarajRouter);
app.use("/api/gaming-gen", gamingGenRouter);
app.use("/api/itopya", itopyaRouter);
app.use("/api/pckolik", pckolikRouter);
app.use("/api/vatan", vatanRouter);
app.use("/api/sinerji", sinerjiRouter);
app.use("/api/getAll", getAllRouter);

// Yeni endpoint
app.get("/api/combined", async (req, res) => {
  try {
    const urls = [
      "http://localhost:3000/api/game-garaj",
      /* 'http://localhost:3000/api/gaming-gen', */
      "http://localhost:3000/api/itopya",
      "http://localhost:3000/api/pckolik",
      "http://localhost:3000/api/vatan",
      "http://localhost:3000/api/sinerji",
    ];

    const fetchPromises = urls.map((url) =>
      fetch(url).then((response) => response.json())
    );

    const results = await Promise.all(fetchPromises);
    const combinedResults = results.flat();

    const products = JSON.parse(await fs.readFile("mock.json", "utf-8"));

    const updatedArr = [
      ...combinedResults,
      ...products.filter((x) => x.store === "gamingGen"),
    ];

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
