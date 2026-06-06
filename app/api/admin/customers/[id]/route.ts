/* ============================================================
   GET /api/admin/customers/[id] — a registered customer's profile
   + order stats (admin only).
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { handle, json, notFound } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = await getDb();
    const u = await db.select().from(users).where(eq(users.id, id)).get();
    if (!u) return notFound("Customer not found");

    const userOrders = await db.select().from(orders).where(eq(orders.userId, id)).all();
    const orderCount = userOrders.length;
    const totalSpent = userOrders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((s, o) => s + o.totalAmount, 0);

    return json({
      customer: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        division: u.division,
        district: u.district,
        area: u.area,
        fullAddress: u.fullAddress,
        memberSince: new Date(u.createdAt).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        orderCount,
        totalSpent,
      },
    });
  });
}
