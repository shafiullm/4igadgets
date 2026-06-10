/* ============================================================
   GET /api/orders/[id]/invoice - download a PDF invoice.
   Only the customer who owns the order may download it.
   ============================================================ */
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { generateInvoicePdf, type InvoiceLine } from "@/lib/invoice";
import { G_PAY_LABEL, G_PAY_STATUS, G_ORDER_STATUS } from "@/lib/invoice-labels";
import { handle, notFound, unauthorized } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized("Please log in to download your invoice");

    const { id } = await params;
    const db = await getDb();
    const order = await db.select().from(orders).where(eq(orders.id, id)).get();
    // Don't leak existence: a missing order and someone else's order both 404.
    if (!order || order.userId !== user.id) return notFound("Invoice not found");

    const its = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
    const ids = its.map((i) => i.productId);
    const prods = ids.length
      ? await db.select().from(products).where(inArray(products.id, ids)).all()
      : [];
    const nameById = new Map(prods.map((p) => [p.id, p.name]));

    const lines: InvoiceLine[] = its.map((i) => ({
      name: nameById.get(i.productId) ?? "Item",
      qty: i.quantity,
      unit: i.priceAtPurchase,
      total: i.priceAtPurchase * i.quantity,
    }));
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const delivery = Math.max(0, order.totalAmount - subtotal);

    const u = await db.select().from(users).where(eq(users.id, user.id)).get();
    const address = [
      [order.shipAddress, order.shipArea].filter(Boolean).join(", "),
      [order.shipDistrict, order.shipDivision].filter(Boolean).join(", "),
    ].filter(Boolean);

    const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const pdf = await generateInvoicePdf({
      orderId: order.id,
      date,
      customerName: u?.name ?? user.name,
      phone: u?.phone ?? "",
      email: u?.email,
      address,
      paymentLabel: G_PAY_LABEL[order.paymentMethod],
      paymentStatus: G_PAY_STATUS[order.paymentStatus],
      orderStatus: G_ORDER_STATUS[order.orderStatus],
      transactionId: order.transactionId ?? undefined,
      lines,
      subtotal,
      delivery,
      total: order.totalAmount,
    });

    return new Response(pdf as BodyInit, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="invoice-${order.id}.pdf"`,
        "cache-control": "no-store",
      },
    });
  });
}
