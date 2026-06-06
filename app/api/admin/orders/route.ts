/* GET /api/admin/orders?filter=all|placed|shipped|delivered|unpaid|cancelled */
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { serializeOrder, toOrderStatus } from "@/lib/serialize";
import { handle, json } from "@/lib/api";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const filter = new URL(req.url).searchParams.get("filter") ?? "all";

    const db = await getDb();
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt)).all();
    const userRows = await db.select().from(users).all();
    const userById = new Map(userRows.map((u) => [u.id, u]));

    let list = all;
    if (filter === "unpaid") list = all.filter((o) => o.paymentStatus !== "PAID");
    else if (filter !== "all") {
      const dbStatus = toOrderStatus(filter);
      if (dbStatus) list = all.filter((o) => o.orderStatus === dbStatus);
    }

    const result = [];
    for (const o of list) {
      const its = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).all();
      const u = o.userId ? userById.get(o.userId) : null;
      result.push(serializeOrder(o, its, u?.name, u?.phone, u?.email));
    }
    return json({ orders: result });
  });
}
