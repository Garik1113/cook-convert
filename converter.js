// All conversion math lives here — pure functions, no DOM access.

const VOLUME_TO_ML = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  fl_oz: 29.5735,
  cup: 236.588,
};

const WEIGHT_TO_G = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

// Oven gas marks mapped to their commonly published Celsius equivalent.
const GAS_MARK_TO_C = [
  { mark: 0.25, c: 110 },
  { mark: 0.5, c: 120 },
  { mark: 1, c: 140 },
  { mark: 2, c: 150 },
  { mark: 3, c: 160 },
  { mark: 4, c: 180 },
  { mark: 5, c: 190 },
  { mark: 6, c: 200 },
  { mark: 7, c: 220 },
  { mark: 8, c: 230 },
  { mark: 9, c: 240 },
];

function convertVolume(value, fromUnit, toUnit) {
  const ml = value * VOLUME_TO_ML[fromUnit];
  return ml / VOLUME_TO_ML[toUnit];
}

function convertWeight(value, fromUnit, toUnit) {
  const grams = value * WEIGHT_TO_G[fromUnit];
  return grams / WEIGHT_TO_G[toUnit];
}

function celsiusToGasMark(celsius) {
  let closest = GAS_MARK_TO_C[0];
  for (const entry of GAS_MARK_TO_C) {
    if (Math.abs(entry.c - celsius) < Math.abs(closest.c - celsius)) {
      closest = entry;
    }
  }
  return closest.mark;
}

function gasMarkToCelsius(mark) {
  const exact = GAS_MARK_TO_C.find((entry) => entry.mark === mark);
  if (exact) return exact.c;
  // Fall back to nearest known mark for unlisted values.
  let closest = GAS_MARK_TO_C[0];
  for (const entry of GAS_MARK_TO_C) {
    if (Math.abs(entry.mark - mark) < Math.abs(closest.mark - mark)) {
      closest = entry;
    }
  }
  return closest.c;
}

function convertTemperature(value, fromUnit, toUnit) {
  let celsius;
  if (fromUnit === "c") celsius = value;
  else if (fromUnit === "f") celsius = ((value - 32) * 5) / 9;
  else if (fromUnit === "gas") celsius = gasMarkToCelsius(value);

  if (toUnit === "c") return celsius;
  if (toUnit === "f") return (celsius * 9) / 5 + 32;
  if (toUnit === "gas") return celsiusToGasMark(celsius);
}

function cupsToGrams(cups, ingredientId) {
  const ingredient = getIngredientById(ingredientId);
  if (!ingredient) return null;
  return cups * ingredient.gramsPerCup;
}

function gramsToCups(grams, ingredientId) {
  const ingredient = getIngredientById(ingredientId);
  if (!ingredient) return null;
  return grams / ingredient.gramsPerCup;
}
