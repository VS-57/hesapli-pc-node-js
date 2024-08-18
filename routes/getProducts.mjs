import { Router } from "express";
import { MongoClient } from "mongodb";

const router = Router();

// MongoDB connection details
const mongoUrl = "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem";
const collectionName = "products";

router.post("/", async (req, res) => {
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

  let client;

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    let query = {};

    // Fiyat filtreleme
    if (startPrice !== undefined && startPrice > 0) {
      query.price = { ...query.price, $gte: startPrice };
    }
    if (endPrice !== undefined && endPrice > 0) {
      query.price = { ...query.price, $lte: endPrice };
    }

    // Arama terimi
    if (searchTerm) {
      query.name = { $regex: new RegExp(searchTerm, "i") };
    }

    // GPU filtreleme
    if (selectedGPUs && selectedGPUs.length > 0) {
      query["specs.GPU"] = {
        $in: selectedGPUs.map((gpu) => new RegExp(gpu, "i")),
      };
    }

    // GPU modelleri filtreleme
    if (selectedGPUModels && selectedGPUModels.length > 0) {
      query["specs.GPU"] = {
        $in: selectedGPUModels.map((series) => {
          if (series.toLowerCase().includes("arc")) {
            return new RegExp(
              `arc.*${series.replace(/\s+/g, "").slice(3)}`,
              "i"
            );
          }
          return new RegExp(series, "i");
        }),
      };
    }

    // CPU modelleri filtreleme
    if (selectedCPUModels && selectedCPUModels.length > 0) {
      query["specs.CPU"] = {
        $in: selectedCPUModels.map(
          (series) => new RegExp(`${series.toLowerCase()} `, "i")
        ),
      };
    }

    // CPU filtreleme
    if (selectedCPUs && selectedCPUs.length > 0) {
      if (selectedCPUs[0].toLowerCase() === "amd" && selectedCPUs.length === 1) {
        query["specs.CPU"] = {
          $regex: /(r3 |r5 |r7 |amd|ryzen)/i,
        };
      } else if (selectedCPUs[0].toLowerCase() === "intel" && selectedCPUs.length === 1) {
        query["specs.CPU"] = {
          $regex: /(i3 |i5 |i7 |intel|ıntel|core)/i,
        };
      }
    }

    // Mağaza filtreleme
    if (stores && stores.length > 0) {
      query.store = { $in: stores.map((store) => new RegExp(store, "i")) };
    }

    // Stok durumu filtreleme
    if (isStocked === true) {
      query.price = { ...query.price, $ne: 0 };
    }

    // Sıralama
    let sort = {};
    if (orderBy) {
      if (orderBy === "lowToHigh") {
        sort.price = 1;
      } else if (orderBy === "highToLow") {
        sort.price = -1;
      }
    }

    // Toplam öğe sayısını al
    const totalItems = await collection.countDocuments(query);

    // Sayfaya göre veriyi al
    const paginatedData = await collection
      .find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    const totalPages = Math.ceil(totalItems / pageSize);

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
    console.error("Error occurred while filtering products:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

export default router;
