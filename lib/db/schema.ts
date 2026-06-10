/* ============================================================
   4iMart - Drizzle schema (SQLite / Cloudflare D1)
   ============================================================ */
import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/** Helper: cuid-ish id default generated in app code (see lib/db/id.ts). */

// ---- Users (customers) ----
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  // Bangladesh-style address (all optional at signup, captured at checkout).
  division: text("division"),
  district: text("district"),
  area: text("area"),
  fullAddress: text("full_address"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---- Categories ----
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
});

// ---- Products ----
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  description: text("description"),
  price: integer("price").notNull(), // whole Taka (৳)
  discountedPrice: integer("discounted_price"), // nullable; null = no discount
  stock: integer("stock").notNull().default(0),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---- Orders ----
// Payment + order status are stored as TEXT enums (D1/SQLite has no native enum).
export const PAYMENT_METHODS = ["BKASH", "NAGAD", "COD"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PENDING_VERIFICATION", "PAID"] as const;
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  // Null userId => guest order; the guest_* fields below are used instead.
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guestName: text("guest_name"),
  guestPhone: text("guest_phone"),
  guestEmail: text("guest_email"),
  // Shipping address snapshot (used for both guest and logged-in orders).
  shipDivision: text("ship_division"),
  shipDistrict: text("ship_district"),
  shipArea: text("ship_area"),
  shipAddress: text("ship_address"),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
  paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES })
    .notNull()
    .default("UNPAID"),
  orderStatus: text("order_status", { enum: ORDER_STATUSES })
    .notNull()
    .default("PENDING"),
  transactionId: text("transaction_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---- Order items ----
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
});

// ---- Support chat ----
// One row per message in a customer<->admin conversation. The conversation is
// keyed by userId (the customer); `sender` says who wrote each message, so the
// thread renders as a proper two-way chat.
export const SUPPORT_SENDERS = ["user", "admin"] as const;
export const supportMessages = sqliteTable("support_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sender: text("sender", { enum: SUPPORT_SENDERS }).notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type SupportSender = (typeof SUPPORT_SENDERS)[number];

// ---- Favourites (wishlist) - one row per (user, product) ----
export const favourites = sqliteTable(
  "favourites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [uniqueIndex("favourites_user_product").on(t.userId, t.productId)],
);

// ---- Reviews / ratings - one review per (user, product) ----
export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1..5
    comment: text("comment"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [uniqueIndex("reviews_user_product").on(t.userId, t.productId)],
);

// ---- Site settings ----
// Generic key/value store for editable site content (e.g. the homepage hero).
// Value holds a JSON blob; parsing/defaults live in lib/settings.ts.
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---- Types ----
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type Favourite = typeof favourites.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
