// Populate the filters when the page loads
function initFilters() {
  populateProcessorModelFilters();
  populateGpuModelFilters();
}

let isMobile = false;

function checkIfMobile() {
  isMobile = window.innerWidth <= 800;
}

// İlk yüklemede kontrol et
checkIfMobile();

// Pencere yeniden boyutlandırıldığında kontrol et
window.addEventListener("resize", checkIfMobile);

// Ayrıca, sayfa yüklendiğinde de kontrol edebilirsiniz
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
  const searchTerm = document
    .getElementById("processorSearch")
    .value.toLowerCase();

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
  const searchTerm = document.getElementById("gpuSearch").value.toLowerCase();

  // Store the current checked states
  const currentCheckedStates = {};
  document
    .querySelectorAll("#gpuModelFilters .form-check-input")
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
    const startPrice = isMobile
      ? Number(document.getElementById("startPriceMobile").value) || 0
      : Number(document.getElementById("startPrice").value) || 0;
    const endPrice = isMobile
      ? Number(document.getElementById("endPriceMobile").value) || null
      : Number(document.getElementById("endPrice").value) || null;
    const selectedCPUs = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          checkbox.id.includes("Intel") || checkbox.id.includes("AMD")
      )
      .map((checkbox) => checkbox.value.toLowerCase());
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
    const selectedModels = Array.from(
      document.querySelectorAll(".form-check-input:checked")
    )
      .filter(
        (checkbox) =>
          !checkbox.id.includes("Intel") &&
          !checkbox.id.includes("AMD") &&
          !checkbox.id.includes("RTX") &&
          !checkbox.id.includes("ARC") &&
          !checkbox.id.includes("GTX") &&
          !checkbox.id.includes("RX") &&
          !checkbox.id.includes("itopya") &&
          !checkbox.id.includes("gamingGen") &&
          !checkbox.id.includes("pckolik") &&
          !checkbox.id.includes("vatan") &&
          !checkbox.id.includes("sinerji") &&
          !checkbox.id.includes("inceHesap") &&
          !checkbox.id.includes("tebilon") &&
          !checkbox.id.includes("gencergaming") &&
          !checkbox.id.includes("gameGaraj")
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
      selectedGPUs: selectedGPUs,
      selectedCPUs: selectedCPUs,
      isStocked: showInStock,
      selectedGPUseries: selectedModels.filter((model) =>
        ["rtx", "gtx", "rx", "arc"].some((keyword) => model.includes(keyword))
      ),
      selectedCPUseries: selectedModels.filter(
        (model) =>
          !["rtx", "gtx", "rx", "arc"].some((keyword) =>
            model.includes(keyword)
          )
      ),
      page: 1,
      stores: selectedStores,
      orderBy: sortOrder,
      pageSize: 2500,
    };

    const response = await fetch("https://ucuzasistem.com/api/getProducts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    document.getElementById("productCount").textContent =
      data.pagination.totalItems;
    renderProducts(data);
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

function setupEventListeners() {
  document.getElementById("filterInput").addEventListener("keyup", getProducts);
  document.getElementById("sortOrder").addEventListener("change", getProducts);
  document
    .getElementById("showInStock")
    .addEventListener("change", getProducts);
  document.querySelectorAll(".form-check-input").forEach(function (checkbox) {
    checkbox.addEventListener("change", getProducts);
  });
  document
    .getElementById("processorSearch")
    .addEventListener("input", filterProcessorModels);
  document
    .getElementById("gpuSearch")
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
  console.log(products);
  products.data.forEach(function (product) {
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
  document.getElementById("productCount").textContent = products.length;
});