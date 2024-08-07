import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression"; // compression paketini import edin
import gameGarajRouter from "./routes/gameGaraj.mjs";
import gamingGenRouter from "./routes/gamingGen.mjs";
import itopyaRouter from "./routes/itopya.mjs";
import pckolikRouter from "./routes/pckolik.mjs";
import vatanRouter from "./routes/vatan.mjs";
import sinerjiRouter from "./routes/sinerji.mjs";
import tebilonRouter from "./routes/tebilon.mjs";
import inceHesapRouter from "./routes/inceHesap.mjs";
import gencerGamingRouter from "./routes/gencergaming.mjs";
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

// Compression middleware'ini kullanın
app.use(compression());

// Statik dosyalar için public dizinini sun
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

/* app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
}); */

app.use("/api/game-garaj", gameGarajRouter);
app.use("/api/gaming-gen", gamingGenRouter);
app.use("/api/itopya", itopyaRouter);
app.use("/api/pckolik", pckolikRouter);
app.use("/api/vatan", vatanRouter);
app.use("/api/sinerji", sinerjiRouter);
app.use("/api/tebilon", tebilonRouter);
app.use("/api/inceHesap", inceHesapRouter);
app.use("/api/gencergaming", gencerGamingRouter);

app.use("/api/getAll", getAllRouter);
app.use("/api/cpu", getCPUs);
app.use("/api/gpu", getGPUs);

app.get("/api/combined", async (req, res) => {
  try {
    const urls = [
      "http://localhost:3000/api/itopya",
      "http://localhost:3000/api/pckolik",
      "http://localhost:3000/api/vatan",
      /* "http://localhost:3000/api/sinerji", */
      "http://localhost:3000/api/inceHesap",
      "http://localhost:3000/api/game-garaj",
      "http://localhost:3000/api/tebilon",
      "http://localhost:3000/api/gencergaming",
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

app.post("/api/getProducts", async (req, res) => {
  const {
    searchTerm,
    startPrice,
    endPrice,
    selectedGPUs,
    selectedCPUs,
    selectedGPUModels,
    selectedCPUModels,
    stores,
    page = 1,
    pageSize = 10,
    orderBy,
    isStocked,
  } = req.body;
  try {
    const data = JSON.parse(await fs.readFile("mock.json", "utf-8"));

    let filteredData = data;

    if (startPrice !== undefined && startPrice > 0) {
      filteredData = filteredData.filter((item) => item.price >= startPrice);
    }
    if (endPrice !== undefined && endPrice > 0) {
      filteredData = filteredData.filter((item) => item.price <= endPrice);
    }
    if (searchTerm !== undefined && searchTerm !== null) {
      filteredData = filteredData.filter((item) =>
        item.name.includes(searchTerm)
      );
    }
    if (selectedGPUs && selectedGPUs.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedGPUs.some((model) =>
          item.specs.GPU?.toLowerCase().includes(model.toLowerCase())
        )
      );
    }
    if (selectedGPUModels && selectedGPUModels.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedGPUModels.some((series) => {
          let gpuName = item.specs.GPU?.toLowerCase();
          if (gpuName && gpuName.includes("arc")) {
            let normalizedSeries = series.replace(/\s+/g, "").toLowerCase();
            const arcIndex = gpuName.indexOf("arc");
            const modifiedGPU =
              gpuName.slice(0, arcIndex + 3) +
              gpuName.slice(arcIndex + 3).replace("a", "");
            gpuName = modifiedGPU.replace(/\s+/g, "");
            return gpuName?.includes(normalizedSeries);
          }
          return gpuName?.includes(series);
        })
      );
    }

    if (selectedCPUModels && selectedCPUModels.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedCPUModels.some((series) =>
          item.specs.CPU?.toLowerCase().includes(series.toLowerCase())
        )
      );
    }

    if (selectedCPUs && selectedCPUs.length > 0) {
      if (selectedCPUs[0] === "amd" && selectedCPUs.length === 1) {
        filteredData = filteredData.filter((item) =>
          selectedCPUs.some(
            (cpu) =>
              item.specs.CPU?.toLowerCase().includes("r3 ") ||
              item.specs.CPU?.toLowerCase().includes("r5 ") ||
              item.specs.CPU?.toLowerCase().includes("r7 ") ||
              item.specs.CPU?.toLowerCase().includes("amd") ||
              item.specs.CPU?.toLowerCase().includes("ryzen")
          )
        );
      } else if (selectedCPUs[0] === "intel" && selectedCPUs.length === 1) {
        filteredData = filteredData.filter((item) =>
          selectedCPUs.some(
            (cpu) =>
              item.specs.CPU?.toLowerCase().includes("i3 ") ||
              item.specs.CPU?.toLowerCase().includes("i5 ") ||
              item.specs.CPU?.toLowerCase().includes("i7 ") ||
              item.specs.CPU?.toLowerCase().includes("intel") ||
              item.specs.CPU?.toLowerCase().includes("ıntel") ||
              item.specs.CPU?.toLowerCase().includes("core")
          )
        );
      }
    }
    if (stores && stores.length > 0) {
      filteredData = filteredData.filter((item) =>
        stores.some((store) =>
          item.store?.toLowerCase().includes(store.toLowerCase())
        )
      );
    }

    if (isStocked === true) {
      filteredData = filteredData.filter((item) => {
        return (
          item.price !== null && item.price !== undefined && item.price !== 0
        );
      });
    }

    if (orderBy) {
      filteredData.sort((a, b) => {
        if (orderBy === "lowToHigh") {
          return a.price - b.price;
        } else if (orderBy === "highToLow") {
          return b.price - a.price;
        }
        return 0;
      });
    }

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedData = filteredData.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    res.json({
      data: paginatedData,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

setupSwagger(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
