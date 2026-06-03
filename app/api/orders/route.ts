/* ============================================================
   POST /api/orders  — place an order (guest or logged-in)
   GET  /api/orders  — current user's order history
   ============================================================ */
import { eq, inArray, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { getSessionUser } from "@/lib/auth/session";
import { toPaymentMethod, initialPaymentStatus } from "@/lib/payments";
import { serializeOrder } from "@/lib/serialize";
import { handle, json, badRequest } from "@/lib/api";

type CartLine = { id: string; qty: number };

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      email?: string;
      division?: string;
      district?: string;
      area?: string;
      address?: string;
      pay?: string;
      txn?: string;
      items?: CartLine[];
    };

    const items = (body.items ?? []).filter((i) => i.id && i.qty > 0);
    if (items.length === 0) return badRequest("Your cart is empty");
    if (!body.name || !body.phone || !body.address) {
      return badRequest("Name, phone and address are required");
    }
    const method = toPaymentMethod(body.pay ?? "");
    if (!method) return badRequest("Choose a valid payment method");
    if (method !== "COD" && !body.txn) {
      return badRequest("Enter the transaction ID for bKash/Nagad");
    }

    const db = await getDb();
    const user = await getSessionUser();

    // Price the order server-side from the DB (never trust client totals).
    const ids = items.map((i) => i.id);
    const rows = await db.select().from(products).where(inArray(products.id, ids)).all();
    const byId = new Map(rows.map((p) => [p.id, p]));
    let total = 0;
    const lineRows = items.map((i) => {
      const p = byId.get(i.id);
      if (!p) throw badRequest(`Product ${i.id} not found`);
      const unit = p.discountedPrice ?? p.price;
      total += unit * i.qty;
      return { productId: p.id, quantity: i.qty, priceAtPurchase: unit };
    });
    if (total < 2000) total += 80; // ৳80 delivery under ৳2,000 (matches the storefront)

    const orderId = newId("ord");
    await db.insert(orders).values({
      id: orderId,
      userId: user?.id ?? null,
      guestName: user ? null : body.name,
      guestPhone: user ? null : body.phone,
      guestEmail: user ? null : body.email ?? null,
      shipDivision: body.division ?? null,
      shipDistrict: body.district ?? null,
      shipArea: body.area ?? null,
      shipAddress: body.address,
      totalAmount: total,
      paymentMethod: method,
      paymentStatus: initialPaymentStatus(method),
      orderStatus: "PENDING",
      transactionId: body.txn ?? null,
    });

    for (const l of lineRows) {
      await db.insert(orderItems).values({ id: newId("oi"), orderId, ...l });
    }

    const created = await db.select().from(orders).where(eq(orders.id, orderId)).get();
    const its = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
    return json({
      order: serializeOrder(created!, its, body.name, body.phone),
    });
  });
}

export async function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return json({ orders: [] });

    const db = await getDb();
    const list = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .all();

    const u = await db.select().from(users).where(eq(users.id, user.id)).get();
    const result = [];
    for (const o of list) {
      const its = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
      result.push(serializeOrder(o, its, u?.name, u?.phone));
    }
    return json({ orders: result });
  });
}
