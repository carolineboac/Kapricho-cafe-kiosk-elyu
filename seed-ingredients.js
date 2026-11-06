// seed-ingredients.js
// Isang beses lang patakbuhin ito: node seed-ingredients.js
// I-lagay ang file na ito sa parehong folder ng kapricho.db (root ng project)

import Database from "better-sqlite3";

const db = new Database("kapricho.db");

// Kung ayaw mong ma-duplicate, i-check muna kung existing na ang pangalan bago i-insert
const insert = db.prepare(`
  INSERT INTO ingredients (id, name, unit, stock_quantity, low_stock_threshold)
  VALUES (?, ?, ?, ?, ?)
`);
const exists = db.prepare(`SELECT id FROM ingredients WHERE name = ?`);

const ingredients = [
  // Coffee & Syrups
  ["Vanilla Syrup", "ml", 2000, 300],
  ["Salted Caramel Syrup", "ml", 2000, 300],
  ["Chocolate/Mocha Syrup", "ml", 2000, 300],
  ["Hazelnut Syrup", "ml", 1500, 300],
  ["Spanish Latte Mix", "ml", 1500, 300],
  ["Whipped Cream", "g", 1000, 200],

  // Non-Coffee / Milk Tea
  ["Hot Chocolate Powder", "g", 2000, 300],
  ["Matcha Powder", "g", 1000, 200],
  ["Detox Tea Bags", "pcs", 100, 20],
  ["Green Tea Bags", "pcs", 100, 20],
  ["Cookies and Cream Powder", "g", 1500, 300],
  ["Strawberry Syrup", "ml", 1500, 300],
  ["Ube Syrup", "ml", 1500, 300],
  ["Wintermelon Syrup", "ml", 1500, 300],
  ["Tapioca Pearls", "g", 3000, 500],
  ["Non-Dairy Creamer", "g", 2000, 300],

  // Sandwiches
  ["Burger Bun", "pcs", 50, 10],
  ["Sandwich Bread", "pcs", 50, 10],
  ["Burger Patty", "pcs", 50, 10],
  ["Chicken Fillet", "pcs", 50, 10],
  ["Ham Slice", "pcs", 100, 20],
  ["Bacon Strip", "pcs", 100, 20],
  ["Cheese Slice", "pcs", 100, 20],
  ["Lettuce", "g", 2000, 300],
  ["Tomato", "g", 2000, 300],
  ["Mayonnaise", "g", 1500, 300],
  ["Potato (fries/hash)", "g", 5000, 1000],

  // Pizza
  ["Pizza Dough", "pcs", 30, 5],
  ["Pizza Sauce", "ml", 3000, 500],
  ["Mozzarella Cheese", "g", 5000, 1000],
  ["Pepperoni", "g", 2000, 400],
  ["Beef Toppings", "g", 2000, 400],
  ["Bacon (Pizza)", "g", 2000, 400],
  ["Mushroom", "g", 2000, 400],
  ["Pineapple Chunks", "g", 1500, 300],
  ["Mixed Meat Toppings", "g", 2000, 400],

  // Extras / Rice Meals / Desserts
  ["Chicken Pop Pieces", "g", 3000, 500],
  ["Hash Brown Pieces", "pcs", 100, 20],
  ["Eggs", "pcs", 100, 20],
  ["Toast Bread", "pcs", 50, 10],
  ["Pancake Mix", "g", 2000, 400],
  ["Waffle Mix", "g", 2000, 400],
  ["Halo-Halo Mix", "g", 3000, 500],
  ["Carbonara Sauce", "ml", 2000, 400],
  ["Bolognese Sauce", "ml", 2000, 400],
  ["Pasta Noodles", "g", 3000, 500],

  // Coffee Beans (Retail)
  ["Atok Arabica Beans (retail)", "g", 5000, 500],
  ["Sagada Arabica Beans (retail)", "g", 5000, 500],
  ["Kalinga Robusta Beans (retail)", "g", 5000, 500],
  ["Barako Beans (retail)", "g", 5000, 500],
  ["Houseblend Beans (retail)", "g", 5000, 500],
  ["Benguet Blend Beans (retail)", "g", 5000, 500],
];

let added = 0;
let skipped = 0;

for (const [name, unit, stock, threshold] of ingredients) {
  if (exists.get(name)) {
    skipped++;
    continue;
  }
  const id = `ing-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  insert.run(id, name, unit, stock, threshold);
  added++;
}

console.log(`Tapos na! ${added} bagong ingredients ang naidagdag, ${skipped} ang na-skip (existing na).`);
db.close();