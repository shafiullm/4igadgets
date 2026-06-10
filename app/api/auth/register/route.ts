/* POST /api/auth/register - create a customer account + start a session. */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { hashPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { handle, json, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password ?? "";

    if (!name || !email || !phone || password.length < 8) {
      return badRequest("Name, email, phone and an 8+ char password are required");
    }

    const db = await getDb();
    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) return badRequest("An account with this email already exists");

    const id = newId("usr");
    await db.insert(users).values({
      id,
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
    });

    await createUserSession({ id, name, email });
    return json({ user: { id, name, email } });
  });
}
