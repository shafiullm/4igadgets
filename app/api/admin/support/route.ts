/* ============================================================
   GET  /api/admin/support - all conversations (grouped by customer)
   POST /api/admin/support - admin replies   Body: { userId, body }
   ============================================================ */
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { supportMessages, users } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { requireAdmin } from "@/lib/auth/session";
import { handle, json, badRequest, notFound } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    const rows = await db
      .select()
      .from(supportMessages)
      .orderBy(asc(supportMessages.createdAt))
      .all();
    const userRows = await db.select().from(users).all();
    const userById = new Map(userRows.map((u) => [u.id, u]));

    // Group messages into one conversation per customer.
    const byUser = new Map<
      string,
      {
        userId: string;
        userName: string;
        userPhone: string;
        messages: typeof rows;
        lastAt: number;
        awaitingReply: boolean;
      }
    >();
    for (const m of rows) {
      let conv = byUser.get(m.userId);
      if (!conv) {
        const u = userById.get(m.userId);
        conv = {
          userId: m.userId,
          userName: u?.name ?? "Customer",
          userPhone: u?.phone ?? "",
          messages: [],
          lastAt: 0,
          awaitingReply: false,
        };
        byUser.set(m.userId, conv);
      }
      conv.messages.push(m);
      conv.lastAt = m.createdAt as unknown as number;
      conv.awaitingReply = m.sender === "user"; // last message from customer => needs a reply
    }

    const conversations = [...byUser.values()].sort((a, b) => b.lastAt - a.lastAt);
    return json({ conversations });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { userId, body } = (await req.json()) as { userId?: string; body?: string };
    if (!userId || !body?.trim()) return badRequest("userId and a reply body are required");

    const db = await getDb();
    const customer = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!customer) return notFound("Customer not found");

    await db.insert(supportMessages).values({
      id: newId("msg"),
      userId,
      sender: "admin",
      body: body.trim(),
    });

    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, userId))
      .orderBy(asc(supportMessages.createdAt))
      .all();
    return json({ messages });
  });
}
