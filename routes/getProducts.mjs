import { Router } from "express";
import { promises as fs } from "fs";

const router = Router();

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
      filteredData = filteredData.filter(
        (item) =>
          item.name &&
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedGPUs && selectedGPUs.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedGPUs.some(
          (model) =>
            item.specs?.GPU &&
            item.specs.GPU.toLowerCase().includes(model.toLowerCase())
        )
      );
    }
    if (selectedGPUModels && selectedGPUModels.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedGPUModels.some((series) => {
          let gpuName = item.specs?.GPU?.toLowerCase();
          if (gpuName && gpuName.includes("arc")) {
            let normalizedSeries = series.replace(/\s+/g, "").toLowerCase();
            const arcIndex = gpuName.indexOf("arc");
            const modifiedGPU =
              gpuName.slice(0, arcIndex + 3) +
              gpuName.slice(arcIndex + 3).replace("a", "");
            gpuName = modifiedGPU.replace(/\s+/g, "");
            return gpuName.includes(normalizedSeries);
          }
          return gpuName?.includes(series);
        })
      );
    }

    if (selectedCPUModels && selectedCPUModels.length > 0) {
      filteredData = filteredData.filter((item) =>
        selectedCPUModels.some(
          (series) =>
            item.specs?.CPU &&
            (item.specs.CPU.toLowerCase() + " ").includes(series.toLowerCase())
        )
      );
    }

    if (selectedCPUs && selectedCPUs.length > 0) {
      if (
        selectedCPUs[0].toLowerCase() === "amd" &&
        selectedCPUs.length === 1
      ) {
        filteredData = filteredData.filter((item) =>
          selectedCPUs.some(
            (cpu) =>
              item.specs?.CPU &&
              (item.specs.CPU.toLowerCase().includes("r3 ") ||
                item.specs.CPU.toLowerCase().includes("r5 ") ||
                item.specs.CPU.toLowerCase().includes("r7 ") ||
                item.specs.CPU.toLowerCase().includes("amd") ||
                item.specs.CPU.toLowerCase().includes("ryzen"))
          )
        );
      } else if (
        selectedCPUs[0].toLowerCase() === "intel" &&
        selectedCPUs.length === 1
      ) {
        filteredData = filteredData.filter((item) =>
          selectedCPUs.some(
            (cpu) =>
              item.specs?.CPU &&
              (item.specs.CPU.toLowerCase().includes("i3 ") ||
                item.specs.CPU.toLowerCase().includes("i5 ") ||
                item.specs.CPU.toLowerCase().includes("i7 ") ||
                item.specs.CPU.toLowerCase().includes("intel") ||
                item.specs.CPU.toLowerCase().includes("ıntel") ||
                item.specs.CPU.toLowerCase().includes("core"))
          )
        );
      }
    }
    if (stores && stores.length > 0) {
      filteredData = filteredData.filter((item) =>
        stores.some(
          (store) =>
            item.store && item.store.toLowerCase().includes(store.toLowerCase())
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
    console.error("Error occurred while filtering products:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
