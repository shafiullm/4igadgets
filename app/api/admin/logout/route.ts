/* POST /api/admin/logout */
import { clearAdminSession } from "@/lib/auth/session";
import { handle, json } from "@/lib/api";

export async function POST() {
  return handle(async () => {
    await clearAdminSession();
    return json({ ok: true });
  });
}
