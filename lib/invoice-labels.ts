/* Human-readable labels for invoice PDFs (DB enum -> display text). */
import type { PaymentMethod, PaymentStatus, OrderStatus } from "./db/schema";

export const G_PAY_LABEL: Record<PaymentMethod, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  COD: "Cash on Delivery",
};

export const G_PAY_STATUS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_VERIFICATION: "Pending verification",
  PAID: "Paid",
};

export const G_ORDER_STATUS: Record<OrderStatus, string> = {
  PENDING: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
