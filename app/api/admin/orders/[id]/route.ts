/* ============================================================
   PATCH /api/admin/orders/[id]
   Body: { status?: <ui status>, confirmPay?: boolean }
   - status: change order status (e.g. -> delivered)
   - confirmPay: move PENDING_VERIFICATION (or UNPAID) -> PAID
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { serializeOrder, toOrderStatus } from "@/lib/serialize";
import { handle, json, badRequest, notFound } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as { status?: string; confirmPay?: boolean };

    const db = await getDb();
    const existing = await db.select().from(orders).where(eq(orders.id, id)).get();
    if (!existing) return notFound("Order not found");

    const patch: Partial<typeof orders.$inferInsert> = {};
    if (body.status) {
      const dbStatus = toOrderStatus(body.status);
      if (!dbStatus) return badRequest("Invalid status");
      patch.orderStatus = dbStatus;
    }
    if (body.confirmPay) patch.paymentStatus = "PAID";
    if (Object.keys(patch).length === 0) return badRequest("Nothing to update");

    await db.update(orders).set(patch).where(eq(orders.id, id));

    const updated = await db.select().from(orders).where(eq(orders.id, id)).get();
    const its = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
    const u = updated!.userId
      ? await db.select().from(users).where(eq(users.id, updated!.userId)).get()
      : null;
    return json({ order: serializeOrder(updated!, its, u?.name, u?.phone) });
  });
}
