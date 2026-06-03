/* ============================================================
   Invoice PDF generation (pure JS — runs on the Workers runtime).
   Uses pdf-lib with the standard Helvetica font, so amounts are
   written as "BDT 1,490" (the ৳ glyph isn't in WinAnsi/Helvetica).
   ============================================================ */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const TEAL = rgb(0x0f / 255, 0x4c / 255, 0x5c / 255);
const INK = rgb(0.16, 0.16, 0.16);
const MUTED = rgb(0.45, 0.43, 0.41);
const LINE = rgb(0.85, 0.83, 0.79);

export type InvoiceLine = { name: string; qty: number; unit: number; total: number };
export type InvoiceData = {
  orderId: string;
  date: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string[]; // pre-formatted address lines
  paymentLabel: string;
  paymentStatus: string;
  orderStatus: string;
  transactionId?: string;
  lines: InvoiceLine[];
  subtotal: number;
  delivery: number;
  total: number;
};

const money = (n: number) =>
  "BDT " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = page.getWidth();
  const M = 50;
  const right = W - M;
  let y = 792;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    f: PDFFont = font,
    color = INK,
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const textRight = (
    s: string,
    xRight: number,
    yy: number,
    size = 10,
    f: PDFFont = font,
    color = INK,
  ) => text(s, xRight - f.widthOfTextAtSize(s, size), yy, size, f, color);

  const rule = (yy: number, p: PDFPage = page) =>
    p.drawLine({ start: { x: M, y: yy }, end: { x: right, y: yy }, thickness: 1, color: LINE });

  // ---- Header ----
  text("4i", M, y, 24, bold, TEAL);
  text("Gadgets", M + bold.widthOfTextAtSize("4i", 24), y, 24, bold, rgb(0xe7 / 255, 0x6f / 255, 0x51 / 255));
  textRight("INVOICE", right, y + 3, 20, bold, INK);
  y -= 16;
  text("Genuine products, delivered across Bangladesh", M, y, 9, font, MUTED);
  textRight("hello@4igadgets.bd", right, y, 9, font, MUTED);
  y -= 14;
  rule(y);
  y -= 22;

  // ---- Meta (left) + status (right) ----
  text("Invoice No.", M, y, 9, font, MUTED);
  text(data.orderId, M, y - 13, 11, bold);
  text("Date", M + 200, y, 9, font, MUTED);
  text(data.date, M + 200, y - 13, 11, bold);
  textRight(`Order: ${data.orderStatus}`, right, y, 10, bold, TEAL);
  textRight(`Payment: ${data.paymentLabel} (${data.paymentStatus})`, right, y - 14, 9, font, MUTED);
  if (data.transactionId) textRight(`TrxID: ${data.transactionId}`, right, y - 27, 9, font, MUTED);
  y -= 44;

  // ---- Bill to ----
  text("BILL TO", M, y, 9, bold, MUTED);
  y -= 15;
  text(data.customerName, M, y, 11, bold);
  y -= 14;
  text(data.phone + (data.email ? `  ·  ${data.email}` : ""), M, y, 10, font, MUTED);
  for (const ln of data.address) {
    y -= 13;
    text(ln, M, y, 10, font, MUTED);
  }
  y -= 26;

  // ---- Table header ----
  const colQty = 340;
  const colUnit = 430;
  text("ITEM", M, y, 9, bold, MUTED);
  textRight("QTY", colQty, y, 9, bold, MUTED);
  textRight("UNIT", colUnit, y, 9, bold, MUTED);
  textRight("AMOUNT", right, y, 9, bold, MUTED);
  y -= 8;
  rule(y);
  y -= 18;

  // ---- Rows ----
  for (const l of data.lines) {
    const name = l.name.length > 52 ? l.name.slice(0, 51) + "…" : l.name;
    text(name, M, y, 10);
    textRight(String(l.qty), colQty, y, 10);
    textRight(money(l.unit), colUnit, y, 10);
    textRight(money(l.total), right, y, 10);
    y -= 20;
  }
  y -= 2;
  rule(y);
  y -= 20;

  // ---- Totals ----
  const totals: [string, string, boolean][] = [
    ["Subtotal", money(data.subtotal), false],
    ["Delivery", data.delivery === 0 ? "FREE" : money(data.delivery), false],
    ["Total", money(data.total), true],
  ];
  for (const [label, val, isTotal] of totals) {
    const size = isTotal ? 13 : 10;
    const f = isTotal ? bold : font;
    textRight(label, colUnit, y, size, f, isTotal ? INK : MUTED);
    textRight(val, right, y, size, f, isTotal ? TEAL : INK);
    y -= isTotal ? 24 : 18;
  }

  // ---- Footer ----
  text("Thank you for shopping with 4iGadgets!", M, 70, 10, bold, TEAL);
  text("Questions about this order? Contact support at hello@4igadgets.bd or 16xxx (9am-9pm).", M, 55, 8.5, font, MUTED);
  rule(44);
  text("This is a computer-generated invoice and does not require a signature.", M, 32, 8, font, MUTED);

  return await doc.save();
}
