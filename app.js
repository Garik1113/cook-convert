// UI wiring — depends on densities.js, converter.js, scaler.js being loaded first.

const UNIT_OPTIONS = {
  volume: [
    { value: "cup", label: "Cup" },
    { value: "tbsp", label: "Tbsp" },
    { value: "tsp", label: "Tsp" },
    { value: "ml", label: "mL" },
    { value: "l", label: "Liter" },
    { value: "fl_oz", label: "Fl oz" },
  ],
  weight: [
    { value: "g", label: "Grams" },
    { value: "kg", label: "Kilograms" },
    { value: "oz", label: "Ounces" },
    { value: "lb", label: "Pounds" },
  ],
  temperature: [
    { value: "c", label: "°C" },
    { value: "f", label: "°F" },
    { value: "gas", label: "Gas Mark" },
  ],
};

const CONVERT_FN = {
  volume: convertVolume,
  weight: convertWeight,
  temperature: convertTemperature,
};

const FREE_INGREDIENT_LIMIT = 3;
const FAVORITES_KEY = "cookConvertFavorites";
const IS_PRO_KEY = "cookConvertIsPro";

let currentCategory = "volume";
let ingredientRows = [
  { id: uid(), name: "", quantity: "", unit: "" },
  { id: uid(), name: "", quantity: "", unit: "" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isPro() {
  return localStorage.getItem(IS_PRO_KEY) === "true";
}

function setPro(value) {
  localStorage.setItem(IS_PRO_KEY, value ? "true" : "false");
}

// ---------- Tab navigation ----------

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetId = btn.dataset.viewTarget;
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("hidden", view.id !== targetId);
    });

    if (targetId === "view-favorites") renderFavorites();
  });
});

// ---------- Convert view ----------

const fromValueEl = document.getElementById("from-value");
const fromUnitEl = document.getElementById("from-unit");
const toValueEl = document.getElementById("to-value");
const toUnitEl = document.getElementById("to-unit");
const genericConverterEl = document.getElementById("generic-converter");
const ingredientConverterEl = document.getElementById("ingredient-converter");
const ingredientSelectEl = document.getElementById("ingredient-select");
const cupsValueEl = document.getElementById("cups-value");
const gramsValueEl = document.getElementById("grams-value");

function populateUnitSelect(selectEl, options, selectedValue) {
  selectEl.innerHTML = "";
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === selectedValue) option.selected = true;
    selectEl.appendChild(option);
  });
}

function setCategory(category) {
  currentCategory = category;

  document.querySelectorAll("#category-tabs .segmented-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });

  if (category === "ingredient") {
    genericConverterEl.classList.add("hidden");
    ingredientConverterEl.classList.remove("hidden");
    return;
  }

  genericConverterEl.classList.remove("hidden");
  ingredientConverterEl.classList.add("hidden");

  const options = UNIT_OPTIONS[category];
  populateUnitSelect(fromUnitEl, options, options[0].value);
  populateUnitSelect(toUnitEl, options, options[1].value);
  fromValueEl.value = "";
  toValueEl.value = "";
  runGenericConversion();
}

function runGenericConversion() {
  const raw = parseFloat(fromValueEl.value);
  if (Number.isNaN(raw)) {
    toValueEl.value = "";
    return;
  }
  const fn = CONVERT_FN[currentCategory];
  const result = fn(raw, fromUnitEl.value, toUnitEl.value);
  toValueEl.value = formatQuantity(result);
}

document.getElementById("category-tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  setCategory(btn.dataset.category);
});

fromValueEl.addEventListener("input", runGenericConversion);
fromUnitEl.addEventListener("change", runGenericConversion);
toUnitEl.addEventListener("change", runGenericConversion);

document.getElementById("swap-btn").addEventListener("click", () => {
  const tempUnit = fromUnitEl.value;
  fromUnitEl.value = toUnitEl.value;
  toUnitEl.value = tempUnit;
  fromValueEl.value = toValueEl.value;
  runGenericConversion();
});

// Ingredient (cup <-> gram) converter
INGREDIENT_DENSITIES.forEach((ing) => {
  const option = document.createElement("option");
  option.value = ing.id;
  option.textContent = ing.name;
  ingredientSelectEl.appendChild(option);
});

let lastIngredientEdited = "cups";

cupsValueEl.addEventListener("input", () => {
  lastIngredientEdited = "cups";
  const cups = parseFloat(cupsValueEl.value);
  if (Number.isNaN(cups)) {
    gramsValueEl.value = "";
    return;
  }
  gramsValueEl.value = formatQuantity(cupsToGrams(cups, ingredientSelectEl.value));
});

gramsValueEl.addEventListener("input", () => {
  lastIngredientEdited = "grams";
  const grams = parseFloat(gramsValueEl.value);
  if (Number.isNaN(grams)) {
    cupsValueEl.value = "";
    return;
  }
  cupsValueEl.value = formatQuantity(gramsToCups(grams, ingredientSelectEl.value));
});

ingredientSelectEl.addEventListener("change", () => {
  if (lastIngredientEdited === "cups") {
    cupsValueEl.dispatchEvent(new Event("input"));
  } else {
    gramsValueEl.dispatchEvent(new Event("input"));
  }
});

document.getElementById("save-favorite-btn").addEventListener("click", () => {
  const favorites = loadFavorites();
  let label;

  if (currentCategory === "ingredient") {
    const ing = getIngredientById(ingredientSelectEl.value);
    if (!cupsValueEl.value || !ing) return;
    label = `${cupsValueEl.value} cups ${ing.name} = ${gramsValueEl.value} g`;
  } else {
    if (!fromValueEl.value) return;
    const fromLabel = UNIT_OPTIONS[currentCategory].find((o) => o.value === fromUnitEl.value).label;
    const toLabel = UNIT_OPTIONS[currentCategory].find((o) => o.value === toUnitEl.value).label;
    label = `${fromValueEl.value} ${fromLabel} = ${toValueEl.value} ${toLabel}`;
  }

  favorites.push({ id: uid(), type: "conversion", label });
  saveFavorites(favorites);
});

// ---------- Scale Recipe view ----------

const ingredientRowsEl = document.getElementById("ingredient-rows");
const addIngredientBtn = document.getElementById("add-ingredient-row");
const originalServingsEl = document.getElementById("original-servings");
const targetServingsEl = document.getElementById("target-servings");
const proBannerEl = document.getElementById("pro-banner");
const scaledListEl = document.getElementById("scaled-list");

function renderIngredientRows() {
  ingredientRowsEl.innerHTML = "";
  ingredientRows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "ingredient-row";
    rowEl.innerHTML = `
      <input type="text" placeholder="Ingredient" value="${escapeHtml(row.name)}" data-field="name" />
      <input type="number" placeholder="Qty" inputmode="decimal" value="${row.quantity}" data-field="quantity" />
      <input type="text" placeholder="Unit" value="${escapeHtml(row.unit)}" data-field="unit" style="flex:1" />
      <button class="remove-row-btn" aria-label="Remove ingredient">✕</button>
    `;

    rowEl.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        row[input.dataset.field] = input.value;
        runScale();
      });
    });

    rowEl.querySelector(".remove-row-btn").addEventListener("click", () => {
      ingredientRows = ingredientRows.filter((r) => r.id !== row.id);
      renderIngredientRows();
      renderProBanner();
      runScale();
    });

    ingredientRowsEl.appendChild(rowEl);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderProBanner() {
  const atLimit = !isPro() && ingredientRows.length >= FREE_INGREDIENT_LIMIT;
  proBannerEl.classList.toggle("hidden", !atLimit);
  addIngredientBtn.disabled = !isPro() && ingredientRows.length >= FREE_INGREDIENT_LIMIT;
}

addIngredientBtn.addEventListener("click", () => {
  if (!isPro() && ingredientRows.length >= FREE_INGREDIENT_LIMIT) {
    renderProBanner();
    return;
  }
  ingredientRows.push({ id: uid(), name: "", quantity: "", unit: "" });
  renderIngredientRows();
  renderProBanner();
});

document.getElementById("unlock-pro-btn").addEventListener("click", () => {
  setPro(true);
  renderProBanner();
});

function runScale() {
  const original = parseFloat(originalServingsEl.value) || 1;
  const target = parseFloat(targetServingsEl.value) || 1;
  const multiplier = multiplierFromServings(original, target);

  const validRows = ingredientRows.filter((r) => r.name && parseFloat(r.quantity) > 0);
  const scaled = scaleIngredients(
    validRows.map((r) => ({ ...r, quantity: parseFloat(r.quantity) })),
    multiplier
  );

  scaledListEl.innerHTML = "";
  scaled.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${formatQuantity(r.quantity)} ${r.unit} ${r.name}`.trim();
    scaledListEl.appendChild(li);
  });
}

originalServingsEl.addEventListener("input", runScale);
targetServingsEl.addEventListener("input", runScale);

document.getElementById("save-recipe-btn").addEventListener("click", () => {
  if (!isPro()) {
    renderProBanner();
    proBannerEl.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const validRows = ingredientRows.filter((r) => r.name && parseFloat(r.quantity) > 0);
  if (validRows.length === 0) return;

  const original = parseFloat(originalServingsEl.value) || 1;
  const target = parseFloat(targetServingsEl.value) || 1;
  const multiplier = multiplierFromServings(original, target);
  const scaledRows = scaleIngredients(
    validRows.map((r) => ({ ...r, quantity: parseFloat(r.quantity) })),
    multiplier
  );

  const favorites = loadFavorites();
  favorites.push({
    id: uid(),
    type: "recipe",
    label: `Recipe (${targetServingsEl.value} servings)`,
    ingredients: scaledRows,
  });
  saveFavorites(favorites);
});

// ---------- Favorites view ----------

const favoritesListEl = document.getElementById("favorites-list");
const favoritesEmptyEl = document.getElementById("favorites-empty");

function renderFavorites() {
  const favorites = loadFavorites();
  favoritesListEl.innerHTML = "";

  if (favorites.length === 0) {
    favoritesListEl.appendChild(favoritesEmptyEl);
    return;
  }

  favorites.forEach((fav) => {
    const item = document.createElement("div");
    item.className = "favorite-item";

    let text = fav.label;
    if (fav.type === "recipe") {
      const parts = fav.ingredients.map((i) => `${formatQuantity(i.quantity)} ${i.unit} ${i.name}`.trim());
      text = `${fav.label}: ${parts.join(", ")}`;
    }

    item.innerHTML = `<span>${escapeHtml(text)}</span>`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Remove favorite");
    removeBtn.addEventListener("click", () => {
      const remaining = loadFavorites().filter((f) => f.id !== fav.id);
      saveFavorites(remaining);
      renderFavorites();
    });
    item.appendChild(removeBtn);
    favoritesListEl.appendChild(item);
  });
}

// ---------- Init ----------

setCategory("volume");
renderIngredientRows();
renderProBanner();
runScale();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
