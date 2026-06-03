/* ============================================================
   GET   /api/admin/support — all support messages (with user name)
   PATCH /api/admin/support — reply to a message  Body: { id, reply }
   ============================================================ */
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { supportMessages, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { handle, json, badRequest, notFound } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    const msgs = await db
      .select()
      .from(supportMessages)
      .orderBy(desc(supportMessages.createdAt))
      .all();
    const userRows = await db.select().from(users).all();
    const nameById = new Map(userRows.map((u) => [u.id, u.name]));
    return json({
      messages: msgs.map((m) => ({ ...m, userName: nameById.get(m.userId) ?? "Customer" })),
    });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { id, reply } = (await req.json()) as { id?: string; reply?: string };
    if (!id || !reply?.trim()) return badRequest("Message id and reply are required");

    const db = await getDb();
    const existing = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.id, id))
      .get();
    if (!existing) return notFound("Message not found");

    await db
      .update(supportMessages)
      .set({ reply: reply.trim() })
      .where(eq(supportMessages.id, id));
    const updated = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.id, id))
      .get();
    return json({ message: updated });
  });
}
