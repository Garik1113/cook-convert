// Grams per US cup for common baking ingredients (commonly published baking references).
const INGREDIENT_DENSITIES = [
  { id: "flour", name: "All-purpose flour", gramsPerCup: 120 },
  { id: "bread_flour", name: "Bread flour", gramsPerCup: 127 },
  { id: "cake_flour", name: "Cake flour", gramsPerCup: 114 },
  { id: "sugar", name: "Granulated sugar", gramsPerCup: 200 },
  { id: "brown_sugar", name: "Brown sugar (packed)", gramsPerCup: 213 },
  { id: "powdered_sugar", name: "Powdered sugar", gramsPerCup: 120 },
  { id: "butter", name: "Butter", gramsPerCup: 227 },
  { id: "cocoa_powder", name: "Cocoa powder", gramsPerCup: 84 },
  { id: "honey", name: "Honey", gramsPerCup: 340 },
  { id: "milk", name: "Milk", gramsPerCup: 245 },
  { id: "vegetable_oil", name: "Vegetable oil", gramsPerCup: 218 },
  { id: "rolled_oats", name: "Rolled oats", gramsPerCup: 90 },
  { id: "rice_uncooked", name: "Rice (uncooked)", gramsPerCup: 185 },
  { id: "peanut_butter", name: "Peanut butter", gramsPerCup: 258 },
  { id: "salt", name: "Salt (table)", gramsPerCup: 292 },
];

function getIngredientById(id) {
  return INGREDIENT_DENSITIES.find((i) => i.id === id);
}
