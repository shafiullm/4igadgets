/* ============================================================
   DB row  ->  UI shape serializers.

   The existing 4iGadgets prototype UI expects a few presentational
   fields that are intentionally NOT in the persisted schema (brand,
   tint, rating, reviews, feature bullets, category icon/group).
   We synthesize them deterministically here so the design renders
   unchanged. They can be promoted to real columns later if needed.
   ============================================================ */
import type {
  Category,
  Product,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from "./db/schema";

// ---- Category presentation maps (by slug) ----
const ICON_BY_SLUG: Record<string, string> = {
  smartphones: "smartphone",
  laptops: "laptop",
  audio: "headphones",
  wearables: "watch",
  mens: "shirt",
  womens: "shopping-bag",
  shoes: "footprints",
  appliances: "washing-machine",
  home: "sofa",
  beauty: "sparkles",
  accessories: "cable",
  gaming: "gamepad-2",
};

const GROUP_BY_SLUG: Record<string, string> = {
  smartphones: "tech",
  laptops: "tech",
  audio: "tech",
  wearables: "tech",
  accessories: "tech",
  gaming: "tech",
  mens: "fashion",
  womens: "fashion",
  shoes: "shoes",
  appliances: "home",
  home: "home",
  beauty: "beauty",
};

export type UiCategory = {
  id: string;
  dbId: string; // real primary key (used by admin edit/delete)
  name: string;
  slug: string;
  icon: string;
  count: number;
  group: string;
  description: string | null;
  imageUrl: string | null;
};

export function serializeCategory(c: Category, count = 0): UiCategory {
  return {
    id: c.slug, // UI keys categories by slug
    dbId: c.id,
    name: c.name,
    slug: c.slug,
    icon: ICON_BY_SLUG[c.slug] ?? "tag",
    count,
    group: GROUP_BY_SLUG[c.slug] ?? "tech",
    description: c.description,
    imageUrl: c.imageUrl,
  };
}

// ---- Feature bullets synthesized per category group ----
const FEATURES: Record<string, string[]> = {
  tech: [
    "1 year official warranty",
    "Genuine, brand-new sealed unit",
    "7-day easy replacement",
    "Free delivery inside Dhaka",
  ],
  fashion: [
    "Premium, comfortable fabric",
    "True-to-size fit",
    "7-day easy size exchange",
    "Cash on delivery available",
  ],
  shoes: [
    "Cushioned all-day comfort",
    "Durable non-slip sole",
    "7-day easy size exchange",
    "Free delivery inside Dhaka",
  ],
  home: [
    "1-5 year brand warranty",
    "Free home delivery & setup",
    "Energy-efficient & durable",
    "EMI available on appliances",
  ],
  beauty: [
    "100% authentic & sealed",
    "Dermatologically tested",
    "Gentle, everyday formula",
    "Cash on delivery available",
  ],
};

/** Stable pseudo-number in [min,max] derived from a string id. */
function hashNum(id: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}

export type UiProduct = {
  id: string;
  name: string;
  slug: string;
  cat: string; // category slug (matches UiCategory.id)
  price: number;
  disc: number; // 0 = no discount
  stock: number;
  desc: string;
  imageUrl: string | null;
  // synthesized, presentational only:
  brand: string;
  tint: "a" | "b";
  rating: number;
  reviews: number;
  features: string[];
};

export function serializeProduct(p: Product, categorySlug: string): UiProduct {
  const group = GROUP_BY_SLUG[categorySlug] ?? "tech";
  const ratingTenths = hashNum(p.id, 41, 49); // 4.1 - 4.9
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    cat: categorySlug,
    price: p.price,
    disc: p.discountedPrice ?? 0,
    stock: p.stock,
    desc: p.description ?? "",
    imageUrl: p.imageUrl,
    brand: p.name.split(" ")[0],
    tint: hashNum(p.id, 0, 1) === 0 ? "a" : "b",
    rating: ratingTenths / 10,
    reviews: hashNum(p.id, 40, 900),
    features: FEATURES[group] ?? FEATURES.tech,
  };
}

// ---- Order enum mapping (DB UPPER_CASE -> UI lowercase keys) ----
const PAY_METHOD_UI: Record<PaymentMethod, string> = {
  BKASH: "bkash",
  NAGAD: "nagad",
  COD: "cod",
};
const PAY_STATUS_UI: Record<PaymentStatus, string> = {
  UNPAID: "unpaid",
  PENDING_VERIFICATION: "pending",
  PAID: "paid",
};
const ORDER_STATUS_UI: Record<OrderStatus, string> = {
  PENDING: "placed",
  CONFIRMED: "confirmed",
  PROCESSING: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export type UiOrder = {
  id: string;
  date: string;
  customer: string;
  guest: boolean;
  phone: string;
  email: string;
  items: [string, number][];
  pay: string;
  payStatus: string;
  status: string;
  txn: string;
  total: number;
  division: string;
  district: string;
  area: string;
  address: string;
};

export function serializeOrder(
  o: Order,
  items: OrderItem[],
  userName?: string | null,
  userPhone?: string | null,
): UiOrder {
  const fmt = new Date(o.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return {
    id: o.id,
    date: fmt,
    customer: o.userId ? userName ?? "Customer" : o.guestName ?? "Guest",
    guest: !o.userId,
    phone: o.userId ? userPhone ?? "" : o.guestPhone ?? "",
    email: o.guestEmail ?? "",
    items: items.map((it) => [it.productId, it.quantity] as [string, number]),
    pay: PAY_METHOD_UI[o.paymentMethod],
    payStatus: PAY_STATUS_UI[o.paymentStatus],
    status: ORDER_STATUS_UI[o.orderStatus],
    txn: o.transactionId ?? "",
    total: o.totalAmount,
    division: o.shipDivision ?? "",
    district: o.shipDistrict ?? "",
    area: o.shipArea ?? "",
    address: o.shipAddress ?? "",
  };
}

// ---- Reverse map: UI status string -> DB enum (for admin updates) ----
const UI_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  placed: "PENDING",
  confirmed: "CONFIRMED",
  packed: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};
export function toOrderStatus(ui: string): OrderStatus | null {
  return UI_TO_ORDER_STATUS[ui] ?? null;
}
