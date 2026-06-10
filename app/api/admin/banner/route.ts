/* ============================================================
   GET /api/admin/banner - current banner config
   PUT /api/admin/banner - save banner config (admin only)
   ============================================================ */
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getBanner, setBanner, normalizeBanner } from "@/lib/settings";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    return json({ banner: await getBanner(db) });
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const banner = normalizeBanner(await req.json());
    const db = await getDb();
    await setBanner(db, banner);
    return json({ banner });
  });
}
