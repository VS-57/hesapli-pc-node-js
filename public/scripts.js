function initFilters() {
  populateProcessorModelFilters();
  populateGpuModelFilters();
}

let isMobile = false;
let currentPage = 1;
let totalPages = 10;

function checkIfMobile() {
  isMobile = window.innerWidth <= 800;
}
checkIfMobile();

window.addEventListener("resize", checkIfMobile);
window.addEventListener("load", checkIfMobile);

const selectedGPUs = Array.from(
  document.querySelectorAll(".form-check-input:checked")
)
  .filter(
    (checkbox) =>
      checkbox.id.includes("RTX") ||
      checkbox.id.includes("GTX") ||
      checkbox.id.includes("ARC") ||
      checkbox.id.includes("RX")
  )
  .map((checkbox) => checkbox.value.toLowerCase());

async function populateProcessorModelFilters() {
  const processorModelFilters = isMobile
    ? document.getElementById("processorModelFiltersMobile")
    : document.getElementById("processorModelFilters");

  processorModelFilters.innerHTML = ""; // Clear existing content
  CPUs.forEach((processor) => {
    const div = document.createElement("div");
    div.className = "form-check";
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.value = processor.value;
    input.id = processor.value;
    input.addEventListener("change", getProducts);

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.htmlFor = processor.value;
    label.textContent = processor.name;

    div.appendChild(input);
    div.appendChild(label);
    processorModelFilters.appendChild(div);
  });
}

async function populateGpuModelFilters() {
  const gpuModelFilters = isMobile
    ? document.getElementById("gpuModelFiltersMobile")
    : document.getElementById("gpuModelFilters");

  gpuModelFilters.innerHTML = ""; // Clear existing content

  gpus
    .filter(
      (x) => x.name.includes(selectedGPUs[0]) || selectedGPUs.length === 0
    )
    .forEach((gpu) => {
      const div = document.createElement("div");
      div.className = "form-check";
      const input = document.createElement("input");
      input.className = "form-check-input";
      input.type = "checkbox";
      input.value = gpu.value;
      input.id = gpu.value;
      input.addEventListener("change", getProducts);

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = gpu.value;
      label.textContent = gpu.name;

      div.appendChild(input);
      div.appendChild(label);
      gpuModelFilters.appendChild(div);
    });
}

function filterProcessorModels() {
  const searchTerm = isMobile
    ? document.getElementById("processorSearchMobile").value.toLowerCase()
    : document.getElementById("processorSearch").value.toLowerCase();

  // Store the current checked states
  const currentCheckedStates = {};
  document
    .querySelectorAll("#processorModelFilters .form-check-input")
    .forEach((checkbox) => {
      currentCheckedStates[checkbox.id] = checkbox.checked;
    });

  const processorModelFilters = isMobile
    ? document.getElementById("processorModelFiltersMobile")
    : document.getElementById("processorModelFilters");

  processorModelFilters.innerHTML = ""; // Clear existing content

  const selectedCPUs = Array.from(
    document.querySelectorAll(".form-check-input:checked")
  )
    .filter(
      (checkbox) => checkbox.id.includes("Intel") || checkbox.id.includes("AMD")
    )
    .map((checkbox) => checkbox.value.toLowerCase());

  const cpuFilterText = selectedCPUs[0] == "intel" ? "core" : "ryzen";

  CPUs.filter(
    (x) =>
      x.name.toLowerCase().includes(cpuFilterText) || selectedCPUs.length !== 1
  ).forEach((processor) => {
    const div = document.createElement("div");
    div.className = "form-check";
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.value = processor.value;
    input.id = processor.value;

    // Restore the checked state if it was checked before
    if (currentCheckedStates[processor.value]) {
      input.checked = true;
    }

    input.addEventListener("change", getProducts);

    if (processor.name.toLowerCase().includes(searchTerm)) {
      div.style.display = "block";
    } else {
      div.style.display = "none";
    }

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.htmlFor = processor.value;
    label.textContent = processor.name;

    div.appendChild(input);
    div.appendChild(label);
    processorModelFilters.appendChild(div);
  });
}

function filterGpuModels() {
  const searchTerm = isMobile
    ? document.getElementById("gpuSearchMobile").value.toLowerCase()
    : document.getElementById("gpuSearch").value.toLowerCase();

  // Store the current checked states
  const currentCheckedStates = {};
  document
    .querySelectorAll("#gpuModelFilters .form-check-input")
    .forEach((checkbox) => {
      currentCheckedStates[checkbox.id] = checkbox.checked;
    });

  document
    .querySelectorAll("#gpuModelFiltersMobile .form-check-input")
    .forEach((checkbox) => {
      currentCheckedStates[checkbox.id] = checkbox.checked;
    });

  const gpuModelFilters = isMobile
    ? document.getElementById("gpuModelFiltersMobile")
    : document.getElementById("gpuModelFilters");

  gpuModelFilters.innerHTML = ""; // Clear existing content

  const selectedGPUs = Array.from(
    document.querySelectorAll(".form-check-input:checked")
  )
    .filter(
      (checkbox) =>
        checkbox.id.includes("RTX") ||
        checkbox.id.includes("GTX") ||
        checkbox.id.includes("ARC") ||
        checkbox.id.includes("RX")
    )
    .map((checkbox) => checkbox.value.toLowerCase());

  gpus
    .filter(
      (x) =>
        x.name.toLowerCase().includes(selectedGPUs[0]) ||
        selectedGPUs.length === 0
    )
    .forEach((gpu) => {
      const div = document.createElement("div");
      div.className = "form-check";
      const input = document.createElement("input");
      input.className = "form-check-input";
      input.type = "checkbox";
      input.value = gpu.value;
      input.id = gpu.value;

      // Restore the checked state if it was checked before
      if (currentCheckedStates[gpu.value]) {
        input.checked = true;
      }

      input.addEventListener("change", getProducts);

      if (gpu.name.toLowerCase().includes(searchTerm)) {
        div.style.display = "block";
      } else {
        div.style.display = "none";
      }

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = gpu.value;
      label.textContent = gpu.name;

      div.appendChild(input);
      div.appendChild(label);
      gpuModelFilters.appendChild(div);
    });
}

async function getProducts() {
  try {
    const searchTerm = document
      .getElementById("filterInput")
      .value.toLowerCase();

    const pageSize = document.getElementById("pageSize").value;

    const startPrice = isMobile
      ? Number(document.getElementById("startPriceMobile").value) || 0
      : Number(document.getElementById("startPrice").value) || 0;
    const endPrice = isMobile
      ? Number(document.getElementById("endPriceMobile").value) || null
      : Number(document.getElementById("endPrice").value) || null;

    const selectedCPUBrands = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id.includes("Intel") || checkbox.id.includes("AMD")
      )
      .map((checkbox) => checkbox.value.toLowerCase());

    const selectedGPUClass = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id === "RTX" ||
          checkbox.id === "GTX" ||
          checkbox.id === "ARC" ||
          checkbox.id === "RX"
      )
      .map((checkbox) => checkbox.value.toLowerCase());

    const selectedGPUModels = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id !== "Intel" &&
          checkbox.id !== "AMD" &&
          checkbox.id !== "RTX" &&
          checkbox.id !== "ARC" &&
          checkbox.id !== "GTX" &&
          checkbox.id !== "RX" &&
          checkbox.id !== "vatan" &&
          checkbox.id !== "itopya" &&
          checkbox.id !== "gamingGen" &&
          checkbox.id !== "gameGaraj" &&
          checkbox.id !== "pckolik" &&
          checkbox.id !== "tebilon" &&
          checkbox.id !== "sinerji" &&
          checkbox.id !== "gencergaming" &&
          checkbox.id !== "inceHesap" &&
          (checkbox.id.toLowerCase().includes("rtx") ||
            checkbox.id.toLowerCase().includes("arc") ||
            checkbox.id.toLowerCase().includes("gtx") ||
            checkbox.id.toLowerCase().includes("rx"))
      )
      .map((checkbox) => checkbox.value.toLowerCase());

    const selectedCPUModels = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id !== "Intel" &&
          checkbox.id !== "AMD" &&
          checkbox.id !== "RTX" &&
          checkbox.id !== "ARC" &&
          checkbox.id !== "GTX" &&
          checkbox.id !== "RX" &&
          checkbox.id !== "vatan" &&
          checkbox.id !== "itopya" &&
          checkbox.id !== "gamingGen" &&
          checkbox.id !== "gameGaraj" &&
          checkbox.id !== "pckolik" &&
          checkbox.id !== "tebilon" &&
          checkbox.id !== "sinerji" &&
          checkbox.id !== "gencergaming" &&
          checkbox.id !== "inceHesap" &&
          !checkbox.id.toLowerCase().includes("rtx") &&
          !checkbox.id.toLowerCase().includes("arc") &&
          !checkbox.id.toLowerCase().includes("gtx") &&
          !checkbox.id.toLowerCase().includes("rx")
      )
      .map((checkbox) => checkbox.value.toLowerCase());

    const sortOrder = document.getElementById("sortOrder").value;
    const showInStock = document.getElementById("showInStock").checked;

    const selectedStores = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id.includes("itopya") ||
          checkbox.id.includes("gamingGen") ||
          checkbox.id.includes("gameGaraj") ||
          checkbox.id.includes("pckolik") ||
          checkbox.id.includes("sinerji") ||
          checkbox.id.includes("inceHesap") ||
          checkbox.id.includes("tebilon") ||
          checkbox.id.includes("gencergaming") ||
          checkbox.id.includes("vatan")
      )
      .map((checkbox) => checkbox.value.toLowerCase());

    const requestBody = {
      searchTerm: searchTerm,
      startPrice: startPrice,
      endPrice: endPrice,
      selectedGPUs: selectedGPUClass,
      selectedCPUs: selectedCPUBrands,
      isStocked: showInStock,
      selectedGPUModels: selectedGPUModels,
      selectedCPUModels: selectedCPUModels,
      page: currentPage,
      stores: selectedStores,
      orderBy: sortOrder,
      pageSize: pageSize,
    };

    const response = await fetch("https://ucuzasistem.com/api/getProducts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    totalPages = data.pagination.totalPages;
    document.getElementById("productCount").textContent =
      data.pagination.totalItems;

    document.getElementById("pageTopInfo").textContent =
      data.pagination.currentPage + " / " + data.pagination.totalPages;

    document.getElementById("pageInfoBottom").textContent =
      data.pagination.currentPage + " / " + data.pagination.totalPages;

    if (
      data.pagination.currentPage > data.pagination.totalPages &&
      data.data.length > 0
    ) {
      currentPage = 1;
      getProducts();
    }

    renderProducts(data.data);
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

function setupEventListeners() {
  document.getElementById("filterInput").addEventListener("keyup", getProducts);
  document.getElementById("sortOrder").addEventListener("change", getProducts);
  document.getElementById("pageSize").addEventListener("change", getProducts);

  document.getElementById("pageSize").addEventListener("change", async () => {
    currentPage = 1;
    await getProducts();
  });

  document.getElementById("prevPage").addEventListener("click", async () => {
    if (currentPage > 1) {
      currentPage--;
      await getProducts();
    }
  });

  document.getElementById("nextPage").addEventListener("click", async () => {
    if (currentPage < totalPages) {
      currentPage++;
      await getProducts();
    }
  });

  document
    .getElementById("prevPageBottom")
    .addEventListener("click", async () => {
      if (currentPage > 1) {
        currentPage--;
        await getProducts();
      }
    });

  document
    .getElementById("nextPageBottom")
    .addEventListener("click", async () => {
      if (currentPage < totalPages) {
        currentPage++;
        await getProducts();
      }
    });

  document
    .getElementById("showInStock")
    .addEventListener("change", getProducts);
  document.querySelectorAll(".form-check-input").forEach(function (checkbox) {
    checkbox.addEventListener("change", getProducts);
  });

  document.querySelectorAll(".form-check-input").forEach(function (checkbox) {
    checkbox.addEventListener("change", filterGpuModels);
  });

  document
    .getElementById("processorSearch")
    .addEventListener("input", filterProcessorModels);
  document
    .getElementById("processorSearchMobile")
    .addEventListener("input", filterProcessorModels);
  document
    .getElementById("gpuSearch")
    .addEventListener("input", filterGpuModels);
  document
    .getElementById("gpuSearchMobile")
    .addEventListener("input", filterGpuModels);
  document
    .getElementById("resetFilters")
    .addEventListener("click", resetFilters);

  document
    .getElementById("priceFilterButton")
    .addEventListener("click", getProducts);
  document
    .getElementById("priceFilterButtonMobile")
    .addEventListener("click", getProducts);
}

function resetFilters() {
  document.getElementById("filterInput").value = "";
  document.getElementById("startPrice").value = "";
  document.getElementById("endPrice").value = "";
  document.getElementById("startPriceMobile").value = "";
  document.getElementById("endPriceMobile").value = "";
  document.querySelectorAll(".form-check-input").forEach(function (checkbox) {
    checkbox.checked = false;
  });
  document.getElementById("sortOrder").value = "default";
  document.getElementById("showInStock").checked = true;
  getProducts();
}

function renderProducts(products) {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";
  products.forEach(function (product) {
    const formattedPrice = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(product.price ?? 0);

    const productCard = `
    <div class="col-md-4 product-item">
        <div class="card product-card" style="position: relative;">
            <img src="${
              product.image
            }" style="margin-top:20px" class="card-img-top product-image" alt="${
      product?.name ?? ""
    }" onerror="this.onerror=null;this.src='https://previews.123rf.com/images/blankstock/blankstock1812/blankstock181201188/113234166-no-or-stop-sign-computer-line-icon-pc-component-sign-monitor-with-case-symbol-caution-prohibited-ban.jpg';">
            <div class="card-body" style="display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                <h5 class="card-title">${product.name ?? ""}</h5>
                <ul class="list-unstyled">
                    <li><strong>CPU:</strong> ${product.specs.CPU ?? ""}</li>
                    <li><strong>GPU:</strong> ${product.specs.GPU ?? ""}</li>
                    <li><strong>Motherboard:</strong> ${
                      product.specs.Motherboard ?? ""
                    }</li>
                    <li><strong>RAM:</strong> ${product.specs.Ram ?? ""}</li>
                    <li><strong>Storage:</strong> ${
                      product.specs?.Storage ?? ""
                    }</li>
                </ul>
                <p class="card-text"><strong>Fiyat: ${formattedPrice}</strong></p>
               <a href="${
                 product.link
               }" class="btn btn-primary" style="background-color:#1c2938;border-color:#1c2938" target="_blank">Detayları Gör</a>
  
            </div>
            <div style="position: absolute; top: 10px; right: 10px;">
                <img src="/logos/${product.store?.toLowerCase()}.png" alt="${
      product.store
    } logo" class="store-logo" style="width: 50px; height: auto;">
            </div>
        </div>
    </div>
    `;
    productList.insertAdjacentHTML("beforeend", productCard);
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  await initFilters();
  setupEventListeners();
  const products = await getProducts();
});
