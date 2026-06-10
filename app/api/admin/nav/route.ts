/* ============================================================
   GET /api/admin/nav - current navbar category links config
   PUT /api/admin/nav - save navbar category links (admin only)
   "Home" and "Shop All" are fixed; only the category anchors
   that follow them are configurable.
   ============================================================ */
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getNavLinks, setNavLinks, normalizeNavLinks } from "@/lib/settings";
import { handle, json } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    return json({ nav: await getNavLinks(db) });
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await req.json();
    const nav = normalizeNavLinks(body);
    const db = await getDb();
    await setNavLinks(db, nav);
    return json({ nav });
  });
}
