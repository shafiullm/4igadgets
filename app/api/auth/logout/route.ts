/* POST /api/auth/logout */
import { clearUserSession } from "@/lib/auth/session";
import { handle, json } from "@/lib/api";

export async function POST() {
  return handle(async () => {
    await clearUserSession();
    return json({ ok: true });
  });
}
