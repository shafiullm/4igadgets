/* GET /api/auth/me - current customer session (or null). */
import { getSessionUser } from "@/lib/auth/session";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    return json({ user });
  });
}
