/* ============================================================
   Payments — manual flow (no gateway). Structured so a real
   gateway (bKash/Nagad API) can be slotted in later behind the
   same interface.
   ============================================================ */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PaymentMethod, PaymentStatus } from "./db/schema";

/** UI sends lowercase method codes; map them to the DB enum. */
export function toPaymentMethod(ui: string): PaymentMethod | null {
  switch (ui) {
    case "bkash":
      return "BKASH";
    case "nagad":
      return "NAGAD";
    case "cod":
      return "COD";
    default:
      return null;
  }
}

/**
 * Initial payment status for a freshly placed order:
 *  - COD: nothing paid online yet -> UNPAID (stays until delivery).
 *  - bKash/Nagad: customer claims to have sent money + gave a TrxID,
 *    so it's PENDING_VERIFICATION until an admin confirms.
 */
export function initialPaymentStatus(method: PaymentMethod): PaymentStatus {
  return method === "COD" ? "UNPAID" : "PENDING_VERIFICATION";
}

/** Merchant numbers shown to customers at checkout (configured via secrets). */
export function getPaymentNumbers() {
  const env = getCloudflareContext().env;
  return {
    bkash: env.BKASH_NUMBER ?? "01XXX-XXXXXX",
    nagad: env.NAGAD_NUMBER ?? "01XXX-XXXXXX",
  };
}

/**
 * Placeholder for a future real gateway integration. Today the manual flow
 * needs no server-side verification call, but keeping this here documents the
 * seam where e.g. bKash Tokenized Checkout would be invoked.
 */
export async function verifyGatewayPayment(): Promise<{ verified: boolean }> {
  return { verified: false }; // manual confirmation by admin for now
}
