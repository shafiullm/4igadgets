/* ============================================================
   PATCH  /api/admin/products/[id] - edit
   DELETE /api/admin/products/[id] - delete
   ============================================================ */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { serializeProduct } from "@/lib/serialize";
import { handle, json, notFound } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      cat?: string;
      desc?: string;
      price?: number;
      disc?: number;
      stock?: number;
      featured?: boolean;
      imageUrl?: string;
    };

    const db = await getDb();
    const existing = await db.select().from(products).where(eq(products.id, id)).get();
    if (!existing) return notFound("Product not found");

    let categoryId = existing.categoryId;
    let catSlug = "";
    if (body.cat) {
      const cat = await db.select().from(categories).where(eq(categories.slug, body.cat)).get();
      if (cat) {
        categoryId = cat.id;
        catSlug = cat.slug;
      }
    }
    if (!catSlug) {
      const cat = await db.select().from(categories).where(eq(categories.id, categoryId)).get();
      catSlug = cat?.slug ?? "";
    }

    await db
      .update(products)
      .set({
        name: body.name?.trim() ?? existing.name,
        categoryId,
        description: body.desc ?? existing.description,
        price: body.price != null ? Number(body.price) : existing.price,
        discountedPrice:
          body.disc != null ? (Number(body.disc) || null) : existing.discountedPrice,
        stock: body.stock != null ? Number(body.stock) : existing.stock,
        isFeatured: body.featured != null ? !!body.featured : existing.isFeatured,
        imageUrl: body.imageUrl ?? existing.imageUrl,
      })
      .where(eq(products.id, id));

    const updated = await db.select().from(products).where(eq(products.id, id)).get();
    return json({ product: serializeProduct(updated!, catSlug) });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const db = await getDb();
    await db.delete(products).where(eq(products.id, id));
    return json({ ok: true });
  });
}
