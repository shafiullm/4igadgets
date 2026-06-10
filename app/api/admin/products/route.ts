/* ============================================================
   GET  /api/admin/products - list (UI shape)
   POST /api/admin/products - create
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { newId } from "@/lib/db/id";
import { requireAdmin } from "@/lib/auth/session";
import { serializeProduct } from "@/lib/serialize";
import { handle, json, badRequest } from "@/lib/api";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const db = await getDb();
    const cats = await db.select().from(categories).all();
    const slugById = new Map(cats.map((c) => [c.id, c.slug]));
    const rows = await db.select().from(products).all();
    return json({
      products: rows.map((p) => serializeProduct(p, slugById.get(p.categoryId) ?? "")),
    });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = (await req.json()) as {
      name?: string;
      cat?: string; // category slug
      desc?: string;
      price?: number;
      disc?: number;
      stock?: number;
      featured?: boolean;
      imageUrl?: string; // admin-entered URL (R2 uploads could replace this later)
    };
    const name = body.name?.trim();
    if (!name || !body.cat || !body.price) {
      return badRequest("Name, category and price are required");
    }

    const db = await getDb();
    const cat = await db.select().from(categories).where(eq(categories.slug, body.cat)).get();
    if (!cat) return badRequest("Unknown category");

    const id = newId("prd");
    await db.insert(products).values({
      id,
      name,
      slug: slugify(name) + "-" + id.slice(-4),
      categoryId: cat.id,
      description: body.desc ?? null,
      price: Number(body.price),
      discountedPrice: body.disc ? Number(body.disc) : null,
      stock: Number(body.stock ?? 0),
      isFeatured: !!body.featured,
      imageUrl: body.imageUrl ?? null,
    });
    const created = await db.select().from(products).where(eq(products.id, id)).get();
    return json({ product: serializeProduct(created!, cat.slug) });
  });
}
