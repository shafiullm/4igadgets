/* ============================================================
   GET /api/admin/hero - current hero config
   PUT /api/admin/hero - save hero config (admin only)
   ============================================================ */
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getHero, setHero, normalizeHero } from "@/lib/settings";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    return json({ hero: await getHero(db) });
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await req.json();
    const hero = normalizeHero(body);
    const db = await getDb();
    await setHero(db, hero);
    return json({ hero });
  });
}
