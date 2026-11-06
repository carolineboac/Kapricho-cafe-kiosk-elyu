import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import multer from "multer";
import crypto from "crypto";

dotenv.config();

const KIOSK_USERNAME = process.env.KIOSK_USERNAME || "Kapricho";
const KIOSK_PASSWORD = process.env.KIOSK_PASSWORD || "kapricho123";

// ── SQLite connection settings ──────────────────────────────
const dbPath = process.env.DATABASE_PATH || process.env.DB_PATH || "kapricho.db";
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Ensure images directory exists
const imagesDir = path.join(process.cwd(), "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, imagesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "image";
      cb(null, `${base}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ─────────────────────────────────────────────────────────────
// DATABASE (SQLite)
// ─────────────────────────────────────────────────────────────
async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return db.prepare(sql).all(...params) as T[];
}
async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return db.prepare(sql).get(...params) as T | undefined;
}
async function run(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
  const res = db.prepare(sql).run(...params);
  return { rowCount: res.changes };
}

// Format ng petsa na maiintindihan ng browser (local time, walang timezone shift)
const TS = "%Y-%m-%dT%H:%M:%S";

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

async function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      min_price DECIMAL(10,2),
      max_price DECIMAL(10,2),
      description TEXT,
      image TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      items TEXT NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      customer_name TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','cancelled','archived')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      archived_at DATETIME
    )
  `);

  // Migrate older schemas: ensure columns exist before creating indexes
  ensureColumn("orders", "customer_name", "TEXT");
  ensureColumn("orders", "status", "TEXT NOT NULL DEFAULT 'completed'");
  ensureColumn("orders", "archived_at", "DATETIME");

  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders (archived_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key_name TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens (email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens (token)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'g',
      stock_quantity REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 200
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      amount_used REAL NOT NULL,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ri_menu ON recipe_ingredients (menu_item_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ri_ing ON recipe_ingredients (ingredient_id)`);

  // Migrate older schemas: ensure columns exist
  ensureColumn("menu_items", "min_price", "DECIMAL(10,2)");
  ensureColumn("menu_items", "max_price", "DECIMAL(10,2)");
  ensureColumn("orders", "customer_name", "TEXT");
  ensureColumn("orders", "status", "TEXT NOT NULL DEFAULT 'completed'");
  ensureColumn("orders", "archived_at", "DATETIME");

  // Seed initial data kung walang laman
  const categoryCount = await get<{ count: number }>("SELECT COUNT(*) AS count FROM categories");
  if (!categoryCount || Number(categoryCount.count) === 0) {
    const categories = [
      { id: "coffee", name: "Coffee" },
      { id: "non-coffee", name: "Non-Coffee" },
      { id: "milk-tea", name: "Milk Tea" },
      { id: "sandwiches", name: "Sandwiches" },
      { id: "pizza", name: "Pizza" },
      { id: "rice-meals", name: "Rice Meals" },
      { id: "korean-drinks", name: "Korean Drinks" },
      { id: "extras", name: "Extras" },
      { id: "coffee-beans", name: "Coffee beans" },
      { id: "coffee-tea-bags", name: "Coffee Tea Bags" },
      { id: "native-biscuits", name: "Native Biscuits" },
      { id: "others", name: "Others" }
    ];
    for (const cat of categories) {
      await run("INSERT INTO categories (id, name) VALUES (?, ?)", [cat.id, cat.name]);
    }

    const items = [
      { id: "c1", category_id: "coffee", name: "Espresso", price: 80, description: "Rich and bold single shot", image: "https://picsum.photos/seed/espresso/400/300" },
      { id: "c2", category_id: "coffee", name: "Americano", price: 100, description: "Espresso with hot water", image: "https://picsum.photos/seed/americano/400/300" },
      { id: "k1", category_id: "korean-drinks", name: "Cool & Cozy Peach", price: 140, description: "Refreshing Korean peach tea", image: "https://picsum.photos/seed/peach/400/300" },
      { id: "r1", category_id: "rice-meals", name: "Beef Tapsilog", price: 165, description: "Marinated beef with garlic rice", image: "https://picsum.photos/seed/tapsilog/400/300" }
    ];
    for (const item of items) {
      await run(
        "INSERT INTO menu_items (id, category_id, name, price, description, image) VALUES (?, ?, ?, ?, ?, ?)",
        [item.id, item.category_id, item.name, item.price, item.description, item.image]
      );
    }
  }

  const ingredientCount = await get<{ count: number }>("SELECT COUNT(*) AS count FROM ingredients");
  if (!ingredientCount || Number(ingredientCount.count) === 0) {
    const sql = "INSERT INTO ingredients (id, name, unit, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?)";
    await run(sql, ["ing-coffee-beans", "Coffee Beans", "g", 5000, 500]);
    await run(sql, ["ing-milk", "Milk", "ml", 8000, 1000]);
    await run(sql, ["ing-syrup-caramel", "Caramel Syrup", "ml", 2000, 300]);
  }
}

// ─────────────────────────────────────────────────────────────
// AVAILABILITY
// ─────────────────────────────────────────────────────────────
type RecipeStockRow = {
  menu_item_id: string;
  ingredient_id: string;
  amount_used: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

const RECIPE_STOCK_SQL = `
  SELECT ri.menu_item_id, ri.ingredient_id, ri.amount_used, i.unit, i.stock_quantity, i.low_stock_threshold
  FROM recipe_ingredients ri
  JOIN ingredients i ON i.id = ri.ingredient_id
`;

const stockNeeded = (r: RecipeStockRow, qty: number) => (r.amount_used * qty) / (r.unit === "kg" ? 1000 : 1);

async function getSoldOutIds(): Promise<Set<string>> {
  const rows = await all<RecipeStockRow>(RECIPE_STOCK_SQL);
  const soldOut = new Set<string>();
  for (const r of rows) {
    if (r.stock_quantity <= r.low_stock_threshold || r.stock_quantity < stockNeeded(r, 1)) {
      soldOut.add(r.menu_item_id);
    }
  }
  return soldOut;
}

function findUnavailable(items: any[]) {
  const ids = [...new Set(items.map(i => i.id).filter(Boolean))];
  if (ids.length === 0) return [] as { id: string; name: string }[];

  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`${RECIPE_STOCK_SQL} WHERE ri.menu_item_id IN (${placeholders})`).all(...ids) as RecipeStockRow[];
  const byProduct = new Map<string, RecipeStockRow[]>();
  for (const r of rows) {
    if (!byProduct.has(r.menu_item_id)) byProduct.set(r.menu_item_id, []);
    byProduct.get(r.menu_item_id)!.push(r);
  }

  const totalNeed = new Map<string, number>();
  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    for (const r of byProduct.get(item.id) || []) {
      totalNeed.set(r.ingredient_id, (totalNeed.get(r.ingredient_id) || 0) + stockNeeded(r, qty));
    }
  }

  const bad = new Map<string, string>();
  for (const item of items) {
    for (const r of byProduct.get(item.id) || []) {
      if (r.stock_quantity <= r.low_stock_threshold || r.stock_quantity < (totalNeed.get(r.ingredient_id) || 0)) {
        bad.set(item.id, String(item?.name ?? ""));
      }
    }
  }
  return [...bad].map(([id, name]) => ({ id, name }));
}

type Period = "daily" | "weekly" | "monthly";

function periodFilterSql(period: Period) {
  if (period === "weekly") return "date('now', '-84 days')";
  if (period === "monthly") return "date('now', '-12 months')";
  return "date('now', '-30 days')";
}

function groupLabel(period: Period, key: string) {
  if (period === "weekly") return `Week of ${key}`;
  if (period === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return key;
}

async function buildSalesReport(period: Period) {
  const dateFilter = periodFilterSql(period);

  const rows = await all<{ items: string; total: number; created_at: string }>(`
    SELECT items, total, strftime('${TS}', created_at) AS created_at
    FROM orders
    WHERE archived_at IS NULL AND created_at >= ${dateFilter}
  `);
  const orders = rows;

  function groupKey(dateStr: string) {
    const datePart = dateStr.slice(0, 10);
    if (period === "monthly") return datePart.slice(0, 7);
    if (period === "weekly") {
      const [y, m, d] = datePart.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
      return dt.toISOString().slice(0, 10);
    }
    return datePart;
  }

  const report: Record<string, Record<string, { qty: number; revenue: number }>> = {};

  for (const order of orders) {
    const key = groupKey(order.created_at);
    let items: { name: string; price: number; quantity: number }[] = [];
    try {
      const parsed = JSON.parse(order.items);
      if (!Array.isArray(parsed)) continue;
      items = parsed;
    } catch {
      continue;
    }
    if (!report[key]) report[key] = {};
    for (const item of items) {
      const name = String(item?.name ?? "Unknown");
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.price) || 0;
      if (qty <= 0) continue;
      if (!report[key][name]) report[key][name] = { qty: 0, revenue: 0 };
      report[key][name].qty += qty;
      report[key][name].revenue += price * qty;
    }
  }

  return report;
}

async function cleanupOldArchives() {
  try {
    const result = await run(`
      DELETE FROM orders
      WHERE archived_at IS NOT NULL
      AND archived_at <= datetime('now', '-30 days')
    `);
    if (result.rowCount > 0) {
      console.log(`[Cleanup] ${result.rowCount} archived orders permanently deleted (30+ days old).`);
    }
  } catch (error) {
    console.error("[Cleanup] Failed:", error);
  }
}

const h =
  (fn: (req: express.Request, res: express.Response) => Promise<any>): express.RequestHandler =>
  (req, res) => {
    fn(req, res).catch((error: any) => {
      console.error(`[Error] ${req.method} ${req.url}:`, error);
      if (!res.headersSent) res.status(500).json({ success: false, error: error.message });
    });
  };

async function startServer() {
  try {
    await initDatabase();
    console.log(`[SQLite] Connected to database`);
  } catch (error: any) {
    console.error(`
  ❌ Hindi maka-connect sa SQLite.
  ${error.message}

  Siguraduhin na:
   1. Writable ang database path.
   2. Tama ang DATABASE_PATH sa .env file.
      `);
    process.exit(1);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 8080;

  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  app.use("/images", express.static(imagesDir));

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/network-info", (req, res) => {
    const localIp = getLocalIp();
    res.json({
      ip: localIp,
      port: PORT,
      url: `http://${localIp}:${PORT}`
    });
  });

  app.get("/api/menu", h(async (req, res) => {
    const categories = await all("SELECT * FROM categories");
    const rawItems = await all("SELECT * FROM menu_items");
    const soldOut = await getSoldOutIds();
    const items = rawItems.map((item: any) => ({ ...item, available: !soldOut.has(item.id) }));

    const menu = {
      categories: categories.map((cat: any) => ({
        ...cat,
        items: items.filter((item: any) => item.category_id === cat.id)
      })),
      addons: {
        drinks: [
          { id: "a1", name: "Over ice", price: 6 },
          { id: "a2", name: "Upsize", price: 10 },
        ]
      }
    };
    res.json(menu);
  }));

  app.post("/api/admin/upload-image", (req, res) => {
    try {
      const { filename, data } = req.body as { filename: string; data: string };
      const match = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(data || "");
      if (!match) {
        return res.status(400).json({ success: false, error: "Invalid image. Use JPG, PNG, WEBP, or GIF." });
      }

      const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
      const baseName = path
        .parse(filename || "image")
        .name.replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 40) || "image";
      const savedName = `${baseName}-${Date.now()}.${ext}`;

      fs.writeFileSync(path.join(imagesDir, savedName), Buffer.from(match[2], "base64"));
      res.json({ success: true, filename: savedName });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/products", h(async (req, res) => {
    const { id, category_id, name, price, description, image } = req.body;
    await run(
      "INSERT INTO menu_items (id, category_id, name, price, description, image) VALUES (?, ?, ?, ?, ?, ?)",
      [id || `item-${Date.now()}`, category_id, name, price, description, image]
    );
    res.json({ success: true });
  }));

  app.delete("/api/admin/products/:id", h(async (req, res) => {
    await run("DELETE FROM recipe_ingredients WHERE menu_item_id = ?", [req.params.id]);
    await run("DELETE FROM menu_items WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  }));

  app.put("/api/admin/products/:id", upload.single("image"), h(async (req, res) => {
    const { name, description, price } = req.body || {};
    const image = (req as any).file ? (req as any).file.filename : undefined;

    const fields: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (price !== undefined) { fields.push("price = ?"); values.push(price); }
    if (image !== undefined) { fields.push("image = ?"); values.push(image); }

    if (fields.length === 0) {
      return res.json({ success: true });
    }
    values.push(req.params.id);
    await run(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ success: true, image });
  }));

  app.post("/api/admin/categories", h(async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Category already exists or invalid data." });
    }
    const id = name.toLowerCase().replace(/\s+/g, "-");
    try {
      await run("INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
      res.json({ success: true, id });
    } catch {
      res.status(400).json({ error: "Category already exists or invalid data." });
    }
  }));

  app.delete("/api/admin/categories/:id", h(async (req, res) => {
    const items = await get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM menu_items WHERE category_id = ?",
      [req.params.id]
    );
    if (items && Number(items.count) > 0) {
      return res.status(400).json({ error: "Cannot delete category with existing products." });
    }
    await run("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  }));

  app.get("/api/admin/orders", h(async (req, res) => {
    const rows = await all(`
      SELECT id, items, total, customer_name, status, strftime('${TS}', created_at) AS created_at
      FROM orders
      WHERE archived_at IS NULL
      ORDER BY created_at DESC, id DESC
    `);
    res.json(rows);
  }));

  app.get("/api/admin/reports", h(async (req, res) => {
    const rows = await all(`
      SELECT strftime('%Y-%m-%d', created_at) AS date, SUM(total) AS total
      FROM orders
      WHERE archived_at IS NULL AND created_at >= date('now', '-30 days')
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date ASC
    `);
    res.json(rows);
  }));

  app.get("/api/admin/reports/sales-by-product", h(async (req, res) => {
    const period = ((req.query.period as string) || "daily") as "daily" | "weekly" | "monthly";
    res.json(await buildSalesReport(period));
  }));

  app.get("/api/admin/reports/export-csv", h(async (req, res) => {
    const period = ((req.query.period as string) || "daily") as "daily" | "weekly" | "monthly";
    const report = await buildSalesReport(period);

    let csv = "Date,Product,Quantity Sold,Revenue\n";
    for (const date in report) {
      for (const product in report[date]) {
        const { qty, revenue } = report[date][product];
        csv += `${date},"${product.replace(/"/g, '""')}",${qty},${revenue}\n`;
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="kapricho-sales-${period}.csv"`);
    res.send(csv);
  }));

  app.get("/api/admin/reports/export-xlsx", h(async (req, res) => {
    const raw = String(req.query.period || "daily");
    const period = (["daily", "weekly", "monthly"].includes(raw) ? raw : "daily") as Period;

    let ExcelJS: any;
    try {
      ExcelJS = (await import("exceljs")).default;
    } catch {
      return res.status(500).json({
        success: false,
        error: 'The Excel library is not installed yet. Run "npm install" in the project folder, then restart the server.'
      });
    }

    const report = await buildSalesReport(period);
    const orders = await all(`
      SELECT id, items, total, strftime('${TS}', created_at) AS created_at
      FROM orders
      WHERE archived_at IS NULL AND created_at >= ${periodFilterSql(period)}
      ORDER BY created_at DESC, id DESC
    `);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Kapricho Kiosk";
    wb.created = new Date();

    const PESO = '"₱"#,##0.00';
    const styleHeader = (row: any) => {
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5A5A40" } };
      row.alignment = { vertical: "middle" };
      row.height = 22;
    };
    const styleTotal = (row: any) => {
      row.font = { bold: true };
      row.border = { top: { style: "thin" } };
    };

    const ws = wb.addWorksheet("Sales per Product");
    ws.columns = [
      { header: "Period", key: "period", width: 26 },
      { header: "Product", key: "product", width: 36 },
      { header: "Quantity Sold", key: "qty", width: 16 },
      { header: "Revenue", key: "revenue", width: 18 },
    ];
    styleHeader(ws.getRow(1));

    let totalQty = 0;
    let totalRevenue = 0;
    for (const key of Object.keys(report).sort((a, b) => (a < b ? 1 : -1))) {
      const products = Object.entries(report[key]).sort((a, b) => b[1].qty - a[1].qty);
      for (const [name, d] of products) {
        const row = ws.addRow({ period: groupLabel(period, key), product: name, qty: d.qty, revenue: d.revenue });
        row.getCell("qty").numFmt = "#,##0";
        row.getCell("revenue").numFmt = PESO;
        totalQty += d.qty;
        totalRevenue += d.revenue;
      }
    }
    const lastDataRow = ws.rowCount;
    const totalRow = ws.addRow({ period: "TOTAL", product: "", qty: totalQty, revenue: totalRevenue });
    totalRow.getCell("qty").numFmt = "#,##0";
    totalRow.getCell("revenue").numFmt = PESO;
    styleTotal(totalRow);
    ws.views = [{ state: "frozen", ySplit: 1 }];
    if (lastDataRow > 1) ws.autoFilter = { from: "A1", to: `D${lastDataRow}` };

    const wo = wb.addWorksheet("Orders");
    wo.columns = [
      { header: "Order #", key: "id", width: 12 },
      { header: "Date & Time", key: "date", width: 22 },
      { header: "Products", key: "products", width: 70 },
      { header: "Total", key: "total", width: 16 },
    ];
    styleHeader(wo.getRow(1));

    let ordersTotal = 0;
    for (const o of orders as any[]) {
      let products = "";
      try {
        products = JSON.parse(o.items).map((it: any) => `${it.quantity}x ${it.name}`).join(", ");
      } catch { /* sira ang items JSON — iwanang blangko */ }

      const [datePart, timePart = "00:00:00"] = o.created_at.split("T");
      const [y, m, d] = datePart.split("-").map(Number);
      const [hh, mm, ss] = timePart.split(":").map(Number);

      const row = wo.addRow({
        id: `#${String(o.id).padStart(4, "0")}`,
        date: new Date(Date.UTC(y, m - 1, d, hh, mm, ss || 0)),
        products,
        total: Number(o.total),
      });
      row.getCell("date").numFmt = "yyyy-mm-dd hh:mm AM/PM";
      row.getCell("total").numFmt = PESO;
      row.getCell("products").alignment = { wrapText: true, vertical: "top" };
      ordersTotal += Number(o.total);
    }
    const ordersLast = wo.rowCount;
    const oTotalRow = wo.addRow({ id: "TOTAL", total: ordersTotal });
    oTotalRow.getCell("total").numFmt = PESO;
    styleTotal(oTotalRow);
    wo.views = [{ state: "frozen", ySplit: 1 }];
    if (ordersLast > 1) wo.autoFilter = { from: "A1", to: `D${ordersLast}` };

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const buffer = await wb.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="kapricho-sales-${period}-${stamp}.xlsx"`);
    res.send(Buffer.from(buffer));
  }));

  app.get("/api/admin/ingredients", h(async (req, res) => {
    res.json(await all("SELECT * FROM ingredients ORDER BY name"));
  }));

  app.post("/api/admin/ingredients", h(async (req, res) => {
    const { name, unit, stock_quantity, low_stock_threshold } = req.body;
    const id = `ing-${Date.now()}`;
    await run(
      "INSERT INTO ingredients (id, name, unit, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?)",
      [id, name, unit || "g", stock_quantity ?? 0, low_stock_threshold ?? 100]
    );
    res.json({ success: true, id });
  }));

  app.post("/api/admin/ingredients/:id/restock", h(async (req, res) => {
    const { amount } = req.body;
    await run("UPDATE ingredients SET stock_quantity = stock_quantity + ? WHERE id = ?", [amount, req.params.id]);
    res.json({ success: true });
  }));

  app.delete("/api/admin/ingredients/:id", h(async (req, res) => {
    await run("DELETE FROM recipe_ingredients WHERE ingredient_id = ?", [req.params.id]);
    await run("DELETE FROM ingredients WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  }));

  app.get("/api/admin/products/:id/recipe", h(async (req, res) => {
    const recipe = await all(`
      SELECT ri.*, i.name AS ingredient_name, i.unit
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.menu_item_id = ?
    `, [req.params.id]);
    res.json(recipe);
  }));

  app.post("/api/admin/products/:id/recipe", h(async (req, res) => {
    const { recipe } = req.body as { recipe: { ingredient_id: string; amount_used: number }[] };
    const menuItemId = req.params.id;

    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM recipe_ingredients WHERE menu_item_id = ?").run(menuItemId);
      const insert = db.prepare("INSERT INTO recipe_ingredients (menu_item_id, ingredient_id, amount_used) VALUES (?, ?, ?)");
      for (const r of recipe || []) {
        if (r.ingredient_id && r.amount_used > 0) {
          insert.run(menuItemId, r.ingredient_id, r.amount_used);
        }
      }
      db.exec("COMMIT");
      res.json({ success: true });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }));

  app.post("/api/admin/maintenance/clear-orders", h(async (req, res) => {
    const result = await run("UPDATE orders SET archived_at = datetime('now') WHERE archived_at IS NULL");
    res.json({ success: true, message: `${result.rowCount} orders archived. Will be permanently deleted after 30 days.` });
  }));

  app.post("/api/admin/maintenance/archive-selected", h(async (req, res) => {
    const ids = (Array.isArray(req.body?.ids) ? req.body.ids : [])
      .map((x: any) => Number(x))
      .filter((n: number) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, error: "No orders selected." });
    }
    const placeholders = ids.map(() => "?").join(",");
    const result = await run(
      `UPDATE orders SET archived_at = datetime('now') WHERE archived_at IS NULL AND id IN (${placeholders})`,
      ids
    );
    res.json({ success: true, message: `${result.rowCount} order(s) archived. Will be permanently deleted after 30 days.` });
  }));

  app.get("/api/admin/maintenance/archive", h(async (req, res) => {
    const rows = await all(`
      SELECT id, items, total,
        strftime('${TS}', created_at) AS created_at,
        strftime('${TS}', archived_at) AS archived_at,
        CAST((julianday('now') - julianday(archived_at)) AS INTEGER) AS days_archived
      FROM orders
      WHERE archived_at IS NOT NULL
      ORDER BY archived_at DESC
    `);
    res.json(rows);
  }));

  app.post("/api/admin/maintenance/archive/:id/restore", h(async (req, res) => {
    await run("UPDATE orders SET archived_at = NULL WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  }));

  app.delete("/api/admin/maintenance/archive/:id", h(async (req, res) => {
    await run("DELETE FROM orders WHERE id = ? AND archived_at IS NOT NULL", [req.params.id]);
    res.json({ success: true });
  }));

  app.post("/api/orders", h(async (req, res) => {
    const { items, total } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Invalid order." });
    }

    db.exec("BEGIN");
    try {
      const unavailable = findUnavailable(items);
      if (unavailable.length > 0) {
        db.exec("ROLLBACK");
        return res.status(409).json({
          success: false,
          error: `Not available anymore: ${unavailable.map(u => u.name).join(", ")}`,
          unavailable
        });
      }

      const info = db.prepare(
        "INSERT INTO orders (items, total, status) VALUES (?, ?, 'completed') RETURNING id"
      ).get(JSON.stringify(items), total) as { id: number };
      const orderId = info.id;

      for (const item of items) {
        const qty = Number(item?.quantity) || 1;
        const recipeRows = db.prepare(`
          SELECT ri.ingredient_id, ri.amount_used, i.unit
          FROM recipe_ingredients ri
          JOIN ingredients i ON i.id = ri.ingredient_id
          WHERE ri.menu_item_id = ?
        `).all(item.id) as { ingredient_id: string; amount_used: number; unit: string }[];
        for (const r of recipeRows) {
          const deduct = (r.amount_used * qty) / (r.unit === "kg" ? 1000 : 1);
          db.prepare("UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE id = ?").run(deduct, r.ingredient_id);
        }
      }

      db.exec("COMMIT");
      res.json({ id: orderId, success: true });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }));

  app.post("/api/login", h(async (req, res) => {
    const { username, password } = req.body;
    const row = await get<{ value: string }>("SELECT value FROM admin_settings WHERE key_name = 'admin_password'");
    const currentPassword = row?.value || KIOSK_PASSWORD;
    if (username === KIOSK_USERNAME && password === currentPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid username or password." });
    }
  }));

  app.post("/api/admin/change-password", h(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "New password and confirmation do not match." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters." });
    }
    const row = await get<{ value: string }>("SELECT value FROM admin_settings WHERE key_name = 'admin_password'");
    const stored = row?.value || KIOSK_PASSWORD;
    if (currentPassword !== stored) {
      return res.status(400).json({ success: false, error: "Current password is incorrect." });
    }
    await run(
      "INSERT INTO admin_settings (key_name, value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value = excluded.value",
      ["admin_password", newPassword]
    );
    res.json({ success: true, message: "Password changed successfully." });
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  cleanupOldArchives();
  setInterval(cleanupOldArchives, 24 * 60 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    const localIp = getLocalIp();
    console.log(`
  Kapricho Kiosk is running!

  > Local:            http://localhost:${PORT}
  > Network (Other):  http://${localIp}:${PORT}

  Connect other devices (phones, tablets) to the same Wi-Fi
  and open the Network URL above to start taking orders.
    `);
  });
}

startServer();
