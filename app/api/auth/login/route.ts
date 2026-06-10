/* POST /api/auth/login - email OR phone + password. */
import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { handle, json, badRequest, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { identifier?: string; password?: string };
    const identifier = body.identifier?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!identifier || !password) return badRequest("Enter your email/phone and password");

    const db = await getDb();
    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, body.identifier!.trim())))
      .get();

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return unauthorized("Incorrect credentials");
    }

    await createUserSession({ id: user.id, name: user.name, email: user.email });
    return json({ user: { id: user.id, name: user.name, email: user.email } });
  });
}
