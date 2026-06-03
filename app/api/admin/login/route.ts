/* POST /api/admin/login — predefined credentials from Cloudflare secrets. */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAdminSession } from "@/lib/auth/session";
import { handle, json, unauthorized, badRequest } from "@/lib/api";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) return badRequest("Email and password required");

    const env = getCloudflareContext().env;
    const okEmail = env.ADMIN_EMAIL;
    const okPass = env.ADMIN_PASSWORD;
    if (!okEmail || !okPass) {
      return badRequest("Admin credentials are not configured on the server");
    }
    if (email.trim().toLowerCase() !== okEmail.toLowerCase() || password !== okPass) {
      return unauthorized("Invalid admin credentials");
    }

    await createAdminSession();
    return json({ ok: true });
  });
}
