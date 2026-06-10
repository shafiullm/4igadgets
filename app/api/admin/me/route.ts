/* GET /api/admin/me - is the caller an authenticated admin? */
import { isAdmin } from "@/lib/auth/session";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => json({ admin: await isAdmin() }));
}
