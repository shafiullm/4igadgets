/* ============================================================
   GET  /api/support  — current user's support thread
   POST /api/support  — send a message to the shop (logged-in only)
   ============================================================ */
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { supportMessages } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { getSessionUser } from "@/lib/auth/session";
import { handle, json, badRequest, unauthorized } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Login to view your messages");
    const db = await getDb();
    const msgs = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, user.id))
      .orderBy(asc(supportMessages.createdAt))
      .all();
    return json({ messages: msgs });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Login to message the shop");
    const { message } = (await req.json()) as { message?: string };
    if (!message?.trim()) return badRequest("Message cannot be empty");

    const db = await getDb();
    const id = newId("msg");
    await db.insert(supportMessages).values({ id, userId: user.id, message: message.trim() });
    const created = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.id, id))
      .get();
    return json({ message: created });
  });
}
