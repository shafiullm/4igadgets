/* ============================================================
   GET  /api/support  - the logged-in customer's chat thread
   POST /api/support  - customer sends a message  Body: { body }
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
    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, user.id))
      .orderBy(asc(supportMessages.createdAt))
      .all();
    return json({ messages });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Login to message the shop");
    const { body } = (await req.json()) as { body?: string };
    if (!body?.trim()) return badRequest("Message cannot be empty");

    const db = await getDb();
    await db.insert(supportMessages).values({
      id: newId("msg"),
      userId: user.id,
      sender: "user",
      body: body.trim(),
    });
    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.userId, user.id))
      .orderBy(asc(supportMessages.createdAt))
      .all();
    return json({ messages });
  });
}
