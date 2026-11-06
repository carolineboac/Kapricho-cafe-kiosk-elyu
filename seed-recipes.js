// seed-recipes.js
// Isang beses lang patakbuhin ito: node seed-recipes.js
// PREREQUISITE: patakbuhin muna ang seed-ingredients.js bago ito, para may ingredients na ma-match.
// I-lagay ang file na ito sa parehong folder ng kapricho.db (root ng project)

import Database from "better-sqlite3";

const db = new Database("kapricho.db");

// Bawat entry: [Pangalan ng Product (dapat eksaktong tugma sa menu_items.name), { IngredientName: amount, ... }]
const recipes = [
  // ── COFFEE ──
  ["Americano", { "Coffee Beans": 18 }],
  ["Espresso", { "Coffee Beans": 18 }],
  ["French Press", { "Coffee Beans": 25 }],
  ["Moka Pot", { "Coffee Beans": 20 }],
  ["Earthy Vanilla Latte", { "Coffee Beans": 18, "Milk": 150, "Vanilla Syrup": 20 }],
  ["Cafe Latte", { "Coffee Beans": 18, "Milk": 180 }],
  ["Cappuccino", { "Coffee Beans": 18, "Milk": 120 }],
  ["Caramel Macchiato", { "Coffee Beans": 18, "Milk": 150, "Caramel Syrup": 20 }],
  ["Cold Brew", { "Coffee Beans": 25 }],
  ["Cold Brew Latte", { "Coffee Beans": 20, "Milk": 150 }],
  ["Mocha Latte", { "Coffee Beans": 18, "Milk": 150, "Chocolate/Mocha Syrup": 20 }],
  ["Salted Caramel Latte", { "Coffee Beans": 18, "Milk": 150, "Salted Caramel Syrup": 20 }],
  ["Spanish Latte", { "Coffee Beans": 18, "Milk": 100, "Spanish Latte Mix": 50 }],
  ["Tiramisu", { "Coffee Beans": 18, "Milk": 150, "Chocolate/Mocha Syrup": 15 }],

  // ── NON-COFFEE ──
  ["Hot Chocolate", { "Hot Chocolate Powder": 30, "Milk": 200 }],
  ["Matcha Latte", { "Matcha Powder": 10, "Milk": 200 }],
  ["Detox Tea", { "Detox Tea Bags": 1 }],
  ["Green Tea", { "Green Tea Bags": 1 }],

  // ── MILK TEA ──
  ["Cookies and Cream", { "Cookies and Cream Powder": 25, "Milk": 150, "Tapioca Pearls": 50 }],
  ["Matcha", { "Matcha Powder": 10, "Milk": 150, "Tapioca Pearls": 50 }],
  ["Salted Caramel", { "Salted Caramel Syrup": 25, "Milk": 150, "Tapioca Pearls": 50 }],
  ["Strawberry Choco", { "Strawberry Syrup": 20, "Chocolate/Mocha Syrup": 15, "Milk": 150, "Tapioca Pearls": 50 }],
  ["Ube", { "Ube Syrup": 25, "Milk": 150, "Tapioca Pearls": 50 }],
  ["Wintermelon", { "Wintermelon Syrup": 25, "Milk": 150, "Tapioca Pearls": 50 }],

  // ── SANDWICHES ──
  ["Burger with fries", { "Burger Bun": 1, "Burger Patty": 1, "Cheese Slice": 1, "Lettuce": 20, "Tomato": 20, "Mayonnaise": 15, "Potato (fries/hash)": 150 }],
  ["Clubhouse sandwich with fries", { "Sandwich Bread": 3, "Ham Slice": 2, "Bacon Strip": 2, "Cheese Slice": 1, "Lettuce": 20, "Tomato": 20, "Mayonnaise": 15, "Potato (fries/hash)": 150 }],
  ["Grilled cheese with fries", { "Sandwich Bread": 2, "Cheese Slice": 2, "Potato (fries/hash)": 150 }],
  ["Grilled ham & cheese with fries", { "Sandwich Bread": 2, "Ham Slice": 2, "Cheese Slice": 2, "Potato (fries/hash)": 150 }],
  ["Crispy Chicken sandwich with fries", { "Sandwich Bread": 2, "Chicken Fillet": 1, "Lettuce": 20, "Mayonnaise": 15, "Potato (fries/hash)": 150 }],

  // ── PIZZA ──
  ["Ham and Cheese", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Ham Slice": 3 }],
  ["Hawaiian", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Ham Slice": 3, "Pineapple Chunks": 60 }],
  ["Pepperoni", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Pepperoni": 80 }],
  ["Beef and mushroom", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Beef Toppings": 80, "Mushroom": 60 }],
  ["Bacon and mushroom", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Bacon (Pizza)": 80, "Mushroom": 60 }],
  ["Four Cheese", { "Pizza Dough": 1, "Pizza Sauce": 60, "Mozzarella Cheese": 200 }],
  ["Chicken Alfredo", { "Pizza Dough": 1, "Mozzarella Cheese": 100, "Chicken Fillet": 1 }],
  ["All meat", { "Pizza Dough": 1, "Pizza Sauce": 80, "Mozzarella Cheese": 100, "Mixed Meat Toppings": 150 }],
  ["Overload", { "Pizza Dough": 1, "Pizza Sauce": 100, "Mozzarella Cheese": 250, "Mixed Meat Toppings": 150, "Mushroom": 60, "Pepperoni": 50 }],

  // ── KOREAN DRINKS ──
  ["Caramel Latte", { "Coffee Beans": 18, "Milk": 150, "Caramel Syrup": 20 }],
  ["Hazelnut Americano", { "Coffee Beans": 18, "Hazelnut Syrup": 20 }],

  // ── EXTRAS / RICE MEALS / DESSERTS ──
  ["French Fries", { "Potato (fries/hash)": 200 }],
  ["Hash Brown", { "Hash Brown Pieces": 3 }],
  ["Chicken Pop", { "Chicken Pop Pieces": 150 }],
  ["Omelet with Toast", { "Eggs": 2, "Toast Bread": 2 }],
  ["Pancake", { "Pancake Mix": 150 }],
  ["Waffle", { "Waffle Mix": 150 }],
  ["Special Halo Halo", { "Halo-Halo Mix": 200, "Milk": 100 }],
  ["Carbonara", { "Pasta Noodles": 150, "Carbonara Sauce": 100, "Bacon Strip": 2 }],
  ["Bolognese Pasta", { "Pasta Noodles": 150, "Bolognese Sauce": 100 }],

  // ── COFFEE BEANS (RETAIL, 250g bag kada order) ──
  ["Atok Arabica", { "Atok Arabica Beans (retail)": 250 }],
  ["Sagada Arabica", { "Sagada Arabica Beans (retail)": 250 }],
  ["Kalinga Robusta", { "Kalinga Robusta Beans (retail)": 250 }],
  ["Barako", { "Barako Beans (retail)": 250 }],
  ["Houseblend", { "Houseblend Beans (retail)": 250 }],
  ["Benguet Blend", { "Benguet Blend Beans (retail)": 250 }],
];

const findProduct = db.prepare(`SELECT id FROM menu_items WHERE name = ? COLLATE NOCASE`);
const findIngredient = db.prepare(`SELECT id FROM ingredients WHERE name = ? COLLATE NOCASE`);
const clearRecipe = db.prepare(`DELETE FROM recipe_ingredients WHERE menu_item_id = ?`);
const insertRecipe = db.prepare(`
  INSERT INTO recipe_ingredients (menu_item_id, ingredient_id, amount_used) VALUES (?, ?, ?)
`);

let productsUpdated = 0;
let productsNotFound = [];
let ingredientsNotFound = new Set();

for (const [productName, ingredientMap] of recipes) {
  const product = findProduct.get(productName);
  if (!product) {
    productsNotFound.push(productName);
    continue;
  }

  clearRecipe.run(product.id);

  let anyIngredientAdded = false;
  for (const [ingredientName, amount] of Object.entries(ingredientMap)) {
    const ingredient = findIngredient.get(ingredientName);
    if (!ingredient) {
      ingredientsNotFound.add(ingredientName);
      continue;
    }
    insertRecipe.run(product.id, ingredient.id, amount);
    anyIngredientAdded = true;
  }

  if (anyIngredientAdded) productsUpdated++;
}

console.log(`\n✅ ${productsUpdated} products ang na-assign na ng recipe.`);

if (productsNotFound.length > 0) {
  console.log(`\n⚠️  Hindi nahanap ang mga sumusunod na product (baka iba ang pangalan sa menu mo, o wala pa):`);
  productsNotFound.forEach(p => console.log(`   - ${p}`));
}

if (ingredientsNotFound.size > 0) {
  console.log(`\n⚠️  Hindi nahanap ang mga sumusunod na ingredient (patakbuhin muna ang seed-ingredients.js):`);
  ingredientsNotFound.forEach(i => console.log(`   - ${i}`));
}

console.log("\nTapos na! Tingnan sa Products tab (Manage Recipe icon) para i-verify.\n");
db.close();
