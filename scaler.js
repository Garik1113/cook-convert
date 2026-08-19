// Recipe scaling — pure functions, no DOM access.

function scaleIngredients(ingredients, multiplier) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: ingredient.quantity * multiplier,
  }));
}

function multiplierFromServings(originalServings, targetServings) {
  if (!originalServings || originalServings <= 0) return 1;
  return targetServings / originalServings;
}

function formatQuantity(quantity) {
  // Round to 2 decimals, then trim trailing zeros.
  const rounded = Math.round(quantity * 100) / 100;
  return rounded.toString();
}
