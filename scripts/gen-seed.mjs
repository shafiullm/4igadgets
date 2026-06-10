/* ============================================================
   Generates drizzle/seed.sql with sample categories + products.
   Run with:  node scripts/gen-seed.mjs
   (Re-run if you tweak the catalog below.)
   ============================================================ */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "drizzle", "seed.sql");

const categories = [
  ["smartphones", "Smartphones", "Latest phones with official warranty."],
  ["laptops", "Laptops", "Powerful laptops for work and play."],
  ["audio", "Audio", "Headphones, earbuds and speakers."],
  ["wearables", "Wearables", "Smartwatches and fitness bands."],
  ["mens", "Men's Fashion", "Shirts, pants and ethnic wear for men."],
  ["womens", "Women's Fashion", "Dresses, kurtis and sarees."],
  ["shoes", "Shoes", "Sneakers, loafers and sandals."],
  ["appliances", "Appliances", "ACs, fridges and washing machines."],
  ["home", "Home & Living", "Cookware, decor and essentials."],
  ["beauty", "Beauty", "Skincare and grooming, 100% authentic."],
  ["accessories", "Accessories", "Chargers, cables and power banks."],
  ["gaming", "Gaming", "Controllers, keyboards and gear."],
];

const desc = {
  tech: (n) =>
    `The ${n} blends premium build quality with everyday reliability. Backed by official warranty and tested before delivery, it is a dependable pick trusted by thousands of customers across Bangladesh.`,
  fashion: (n) =>
    `Look and feel your best with the ${n}. Made from comfortable, breathable fabric with a true-to-size fit and finishing built to last wash after wash.`,
  shoes: (n) =>
    `Step out in confidence with the ${n}. Cushioned for all-day comfort with a durable, non-slip sole. Easy size exchange available.`,
  home: (n) =>
    `Bring comfort and quality home with the ${n}. Thoughtfully made from premium materials that are easy to clean and built to last.`,
  beauty: (n) =>
    `Care for yourself with the ${n}. 100% authentic, dermatologically tested and gentle on skin. Sealed and genuine.`,
};
const groupOf = (cat) =>
  ["mens", "womens"].includes(cat)
    ? "fashion"
    : cat === "shoes"
      ? "shoes"
      : cat === "beauty"
        ? "beauty"
        : ["appliances", "home"].includes(cat)
          ? "home"
          : "tech";

// [id, name, category, price, discountedPrice|null]
const products = [
  ["p1", "Aurora X12 Smartphone (8/256GB)", "smartphones", 42990, 37990],
  ["p2", "Nimbus Note 5 Pro (12/512GB)", "smartphones", 58500, 52900],
  ["p3", "Aurora Lite A3 (6/128GB)", "smartphones", 18990, 16490],
  ["p4", "Stratos UltraBook 14 (i7/16GB)", "laptops", 112000, 99900],
  ["p5", "Stratos Air 13 (Ryzen 5)", "laptops", 74500, 68900],
  ["p7", "EchoBuds Pro 2 ANC", "audio", 8900, 6490],
  ["p8", "Sonus Over-Ear Studio", "audio", 14500, 11900],
  ["p10", "Pulse Watch S2 (AMOLED)", "wearables", 12900, 9990],
  ["p11", "Pulse Watch Active", "wearables", 5990, 4490],
  ["p12", "VoltCore 20000mAh Power Bank", "accessories", 3490, 2790],
  ["p14", "65W GaN Charger (3-Port)", "accessories", 2890, 2190],
  ["p15", "Braided USB-C Cable 2m", "accessories", 690, 490],
  ["p18", "Raptor Wireless Gamepad", "gaming", 4290, 3490],
  ["p19", "Raptor RGB Mechanical Keyboard", "gaming", 6900, 5490],
  ["p25", "Classic Oxford Shirt", "mens", 1890, 1490],
  ["p26", "Slim-Fit Chino Pants", "mens", 2290, 1790],
  ["p27", "Cotton Polo T-Shirt", "mens", 990, 790],
  ["p28", "Washed Denim Jacket", "mens", 3490, 2790],
  ["p48", "Premium Panjabi (Eid Edition)", "mens", 2990, 2290],
  ["p29", "Floral Summer Dress", "womens", 2490, 1990],
  ["p30", "Embroidered Cotton Kurti", "womens", 1690, 1290],
  ["p31", "Handloom Cotton Saree", "womens", 3990, 3290],
  ["p32", "Soft Knit Cardigan", "womens", 2190, 1690],
  ["p49", "Three-Piece Salwar Set", "womens", 3290, 2590],
  ["p33", "AirStride Running Sneakers", "shoes", 3490, 2790],
  ["p34", "Genuine Leather Loafers", "shoes", 4290, 3490],
  ["p35", "Casual Canvas Shoes", "shoes", 1690, 1290],
  ["p36", "Comfort Sport Sandals", "shoes", 1290, 990],
  ["p37", "1.5 Ton Inverter AC", "appliances", 64900, 58900],
  ["p38", "Front-Load Washing Machine 8kg", "appliances", 48900, 43900],
  ["p39", "Digital Microwave Oven 25L", "appliances", 14900, 12900],
  ["p40", "Double-Door Refrigerator 320L", "appliances", 52900, 47900],
  ["p41", "Non-Stick Cookware Set (5pc)", "home", 3490, 2690],
  ["p42", "Memory Foam Pillow (2pc)", "home", 1890, 1390],
  ["p43", "LED Desk Lamp (Dimmable)", "home", 1290, 890],
  ["p44", "Ceramic Dinner Set (24pc)", "home", 4290, 3490],
  ["p45", "Vitamin C Face Serum", "beauty", 1290, 990],
  ["p46", "Ionic Hair Dryer 2000W", "beauty", 2490, 1890],
  ["p47", "Skincare Gift Set", "beauty", 2990, 2290],
];

// Admin-featured picks for the homepage (fewer than 8, so the
// rating-based auto-fill is exercised too).
const featured = new Set(["p1", "p4", "p33"]);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const esc = (s) => String(s).replace(/'/g, "''");

let sql = `-- 4iMart seed data (idempotent). Generated by scripts/gen-seed.mjs
-- Apply locally:  npm run db:seed:local
-- Apply remote:   npm run db:seed:remote

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;

`;

for (const [slug, name, d] of categories) {
  sql += `INSERT INTO categories (id, name, slug, description, image_url) VALUES ('${slug}', '${esc(name)}', '${slug}', '${esc(d)}', NULL);\n`;
}
sql += "\n";

for (const [id, name, cat, price, disc] of products) {
  const description = desc[groupOf(cat)](name);
  const discVal = disc == null ? "NULL" : disc;
  sql += `INSERT INTO products (id, name, slug, category_id, description, price, discounted_price, stock, is_featured, image_url) VALUES ('${id}', '${esc(name)}', '${slugify(name)}', '${cat}', '${esc(description)}', ${price}, ${discVal}, ${20 + ((price % 7) + 1) * 5}, ${featured.has(id) ? 1 : 0}, NULL);\n`;
}

writeFileSync(out, sql);
console.log("Wrote", out, "(", categories.length, "categories,", products.length, "products )");
