"use server";
import { revalidatePath } from "next/cache";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/catalog";
import { sendOrderNotification } from "@/lib/notify";
import { resolvePrice } from "@/lib/pricing";
import { getPublicClient } from "@/lib/supabase/public";
import { ORDER_ERROR_MESSAGES, normalizePhone, validateCheckout, type CheckoutErrors, type CheckoutInput } from "@/lib/validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CartQuoteLine {
  variantId: string; available: boolean; stock: number; price: number; compareAt: number | null;
  name: string; slug: string; brand: string | null; size: string; image: string | null; productId: string;
}

/** Current prices & stock for the items in a cart (straight from the admin's data). */
export async function getCartQuote(variantIds: string[]): Promise<CartQuoteLine[]> {
  const ids = [...new Set(variantIds)].filter((id) => UUID.test(id)).slice(0, 50);
  const db = getPublicClient();
  if (!db || ids.length === 0) return [];
  const { data: variants } = await db.from("product_variants").select("id, product_id").in("id", ids);
  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  if (productIds.length === 0) return [];
  const { data } = await db.from("products").select(PRODUCT_SELECT).in("id", productIds).eq("is_published", true);
  const products = (data ?? []).map(normalizeProduct);

  const out: CartQuoteLine[] = [];
  for (const p of products) {
    for (const v of p.variants) {
      if (!ids.includes(v.id)) continue;
      const price = resolvePrice(p, v);
      out.push({
        variantId: v.id, productId: p.id, available: !p.is_sold_out && v.stock > 0, stock: p.is_sold_out ? 0 : v.stock,
        price: price.price, compareAt: price.compareAt, name: p.name, slug: p.slug, brand: p.brand?.name ?? null,
        size: v.size, image: p.images[0]?.url ?? null,
      });
    }
  }
  return out;
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number; items: { product_name: string; brand_name: string | null; size: string; quantity: number; line_total: number }[] }
  | { ok: false; message: string; fieldErrors?: CheckoutErrors };

export async function placeOrder(input: CheckoutInput & { website?: string }, items: { variantId: string; quantity: number }[], idempotencyKey: string): Promise<PlaceOrderResult> {
  // Honeypot: real visitors never fill in this hidden field.
  if (input.website) return { ok: false, message: ORDER_ERROR_MESSAGES.server_error };

  const clean: CheckoutInput = {
    name: String(input.name ?? "").slice(0, 200),
    phone: String(input.phone ?? "").slice(0, 40),
    snapchat: String(input.snapchat ?? "").slice(0, 60),
    email: String(input.email ?? "").slice(0, 300),
    notes: String(input.notes ?? "").slice(0, 2000),
  };
  const fieldErrors = validateCheckout(clean);
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Controleer de gemarkeerde velden.", fieldErrors };
  if (!UUID.test(idempotencyKey)) return { ok: false, message: ORDER_ERROR_MESSAGES.server_error };
  if (!Array.isArray(items) || items.length === 0) return { ok: false, message: ORDER_ERROR_MESSAGES.empty_cart };

  const lines = items
    .filter((i) => UUID.test(String(i.variantId)) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20)
    .slice(0, 50)
    .map((i) => ({ variant_id: i.variantId, quantity: i.quantity }));
  if (lines.length !== items.length) return { ok: false, message: ORDER_ERROR_MESSAGES.invalid_quantity };

  const db = getPublicClient();
  if (!db) return { ok: false, message: "De webshop is nog niet gekoppeld aan de database. Probeer het later opnieuw." };

  const { data, error } = await db.rpc("place_order", {
    p_idempotency_key: idempotencyKey,
    p_name: clean.name.trim(),
    p_phone: normalizePhone(clean.phone),
    p_snapchat: clean.snapchat.trim().replace(/^@/, "") || null,
    p_email: clean.email.trim() || null,
    p_notes: clean.notes.trim() || null,
    p_items: lines,
  });

  if (error || !data) {
    console.error("place_order failed", error?.message);
    return { ok: false, message: ORDER_ERROR_MESSAGES.server_error };
  }
  if (!data.ok) {
    const base = ORDER_ERROR_MESSAGES[data.error as string] ?? ORDER_ERROR_MESSAGES.server_error;
    // Only stock problems carry a readable detail ("Product (maat)").
    return { ok: false, message: data.error === "insufficient_stock" && data.detail ? `${base} (${data.detail})` : base };
  }

  if (!data.duplicate) {
    await sendOrderNotification({
      order_number: data.order_number, customer_name: clean.name.trim(), total: Number(data.total),
      created_at: new Date().toISOString(), items: data.items ?? [],
    });
    revalidatePath("/", "layout"); // stock changed
  }

  return {
    ok: true, orderNumber: data.order_number, total: Number(data.total),
    items: (data.items ?? []).map((l: { product_name: string; brand_name: string | null; size: string; quantity: number; line_total: number }) => ({
      product_name: l.product_name, brand_name: l.brand_name, size: l.size, quantity: l.quantity, line_total: Number(l.line_total),
    })),
  };
}
