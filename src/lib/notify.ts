import "server-only";
import { formatDateTime, formatPrice } from "./format";
import { SITE_URL } from "./site";

interface Line { product_name: string; brand_name: string | null; size: string; quantity: number; line_total: number }

export const emailNotificationsConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.ORDER_NOTIFICATION_EMAIL);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Sends a new-order email to the shop owner through Resend (https://resend.com),
 * only when RESEND_API_KEY and ORDER_NOTIFICATION_EMAIL are set. Never throws:
 * the order is already saved, so a mail problem must not break checkout.
 */
export async function sendOrderNotification(order: {
  order_number: string; customer_name: string; total: number; created_at: string; items: Line[];
}) {
  if (!emailNotificationsConfigured()) return { sent: false, reason: "not_configured" as const };
  const lines = order.items
    .map((l) => `<tr><td style="padding:6px 0">${esc(l.brand_name ?? "")} — ${esc(l.product_name)}<br><small>Maat ${esc(l.size)} · ${l.quantity}×</small></td><td style="padding:6px 0;text-align:right">${formatPrice(l.line_total)}</td></tr>`)
    .join("");
  const html = `<div style="font-family:Georgia,serif;color:#2b211a;max-width:560px">
    <h2 style="font-weight:400;letter-spacing:.08em">Nieuwe bestelling ${esc(order.order_number)}</h2>
    <p>Klant: <strong>${esc(order.customer_name)}</strong><br>Datum: ${formatDateTime(order.created_at)}</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e4d3be;border-bottom:1px solid #e4d3be">${lines}</table>
    <p style="font-size:18px">Totaal: <strong>${formatPrice(order.total)}</strong></p>
    <p><a href="${SITE_URL}/admin/bestellingen" style="color:#8a6a3f">Open de bestelling in het dashboard</a> voor de contactgegevens.</p>
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_NOTIFICATION_FROM || "NOIR FASHION <onboarding@resend.dev>",
        to: [process.env.ORDER_NOTIFICATION_EMAIL],
        subject: `Nieuwe bestelling ${order.order_number} — ${formatPrice(order.total)}`,
        html,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error("Order email failed", res.status, await res.text());
      return { sent: false, reason: "error" as const };
    }
    return { sent: true as const };
  } catch (e) {
    console.error("Order email failed", e);
    return { sent: false, reason: "error" as const };
  }
}
