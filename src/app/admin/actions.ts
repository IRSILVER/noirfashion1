"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { getServerClient } from "@/lib/supabase/server";
import type { OrderStatus, ProductCondition } from "@/lib/types";
import { PAGES } from "@/lib/pages";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const refreshShop = () => revalidatePath("/", "layout");
const CONDITIONS: ProductCondition[] = ["new_with_tags", "new_without_tags", "preowned_excellent", "preowned_good"];
const STATUSES: OrderStatus[] = ["new", "awaiting_confirmation", "awaiting_payment", "paid", "processing", "completed", "cancelled"];

/** Parses a euro amount typed in Dutch or English notation: "1.249,50", "1249.5", "€ 80". */
function money(v: unknown, required: boolean): number | null | "invalid" {
  if (v === null || v === undefined || String(v).trim() === "") return required ? "invalid" : null;
  let s = String(v).replace(/[€\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return "invalid";
  return Math.round(n * 100) / 100;
}

// ===================================================================== auth

export async function login(_: unknown, formData: FormData): Promise<{ error: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Vul je e-mailadres en wachtwoord in." };
  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Onjuist e-mailadres of wachtwoord." };
  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return { error: "Dit account heeft geen beheerdersrechten." };
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ================================================================= products

export interface ProductPayload {
  id?: string;
  name: string;
  slug: string;
  description: string;
  brand_id: string | null;
  category_id: string | null;
  condition: ProductCondition;
  price: string;
  sale_price: string;
  is_published: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_sold_out: boolean;
  variants: { id?: string; size: string; stock: string | number; price: string; sale_price: string }[];
  images: { id?: string; url: string; storage_path: string | null; alt: string }[];
}

export async function saveProduct(p: ProductPayload): Promise<Result<{ id: string; slug: string }>> {
  const { supabase } = await requireAdmin();

  const name = p.name?.trim();
  if (!name) return { ok: false, error: "Vul een productnaam in." };
  if (!CONDITIONS.includes(p.condition)) return { ok: false, error: "Kies een geldige staat." };
  const price = money(p.price, true);
  if (price === "invalid" || price === null) return { ok: false, error: "Vul een geldige verkoopprijs in (bijv. 249,00)." };
  const sale = money(p.sale_price, false);
  if (sale === "invalid") return { ok: false, error: "De actieprijs is ongeldig." };
  if (sale !== null && sale >= price) return { ok: false, error: "De actieprijs moet lager zijn dan de verkoopprijs." };

  const variants: { id?: string; size: string; stock: number; price: number | null; sale_price: number | null; sort_order: number }[] = [];
  const seen = new Set<string>();
  for (const [i, v] of (p.variants ?? []).entries()) {
    const size = String(v.size ?? "").trim();
    if (!size) return { ok: false, error: `Maat ${i + 1}: vul een maat in (bijv. M of One size).` };
    if (seen.has(size.toLowerCase())) return { ok: false, error: `De maat "${size}" staat er twee keer in.` };
    seen.add(size.toLowerCase());
    const stock = Number(v.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { ok: false, error: `Maat ${size}: voorraad moet een heel getal van 0 of hoger zijn.` };
    const vp = money(v.price, false);
    const vs = money(v.sale_price, false);
    if (vp === "invalid" || vs === "invalid") return { ok: false, error: `Maat ${size}: ongeldige prijs.` };
    const compare = vp ?? price;
    if (vs !== null && vs >= compare) return { ok: false, error: `Maat ${size}: de actieprijs moet lager zijn dan de prijs.` };
    variants.push({ id: v.id, size, stock, price: vp, sale_price: vs, sort_order: i });
  }

  // Unique slug
  const base = slugify(p.slug?.trim() || name) || "product";
  let slug = base;
  for (let n = 2; ; n++) {
    const { data } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === p.id) break;
    slug = `${base}-${n}`;
  }

  const row = {
    name, slug, description: p.description?.trim() || null,
    brand_id: p.brand_id || null, category_id: p.category_id || null, condition: p.condition,
    price, sale_price: sale,
    is_published: !!p.is_published, is_featured: !!p.is_featured,
    is_new_arrival: !!p.is_new_arrival, is_sold_out: !!p.is_sold_out,
  };

  let id = p.id;
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { ok: false, error: `Opslaan mislukt: ${error.message}` };
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error || !data) return { ok: false, error: `Opslaan mislukt: ${error?.message}` };
    id = data.id as string;
  }

  // ---- sizes: delete removed, update existing, insert new (keeps ids linked to orders)
  const { data: existingV } = await supabase.from("product_variants").select("id").eq("product_id", id);
  const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const removeV = (existingV ?? []).map((v) => v.id as string).filter((vid) => !keepIds.has(vid));
  if (removeV.length) await supabase.from("product_variants").delete().in("id", removeV);
  // temporary rename avoids unique (product_id, size) clashes when sizes are swapped
  for (const v of variants.filter((v) => v.id)) {
    await supabase.from("product_variants").update({ size: `__tmp_${v.id}` }).eq("id", v.id!);
  }
  for (const v of variants) {
    const data = { product_id: id, size: v.size, stock: v.stock, price: v.price, sale_price: v.sale_price, sort_order: v.sort_order };
    const { error } = v.id
      ? await supabase.from("product_variants").update(data).eq("id", v.id)
      : await supabase.from("product_variants").insert(data);
    if (error) return { ok: false, error: `Maat ${v.size} opslaan mislukt: ${error.message}` };
  }

  // ---- images
  const images = (p.images ?? []).filter((img) => typeof img.url === "string" && img.url.startsWith("https://"));
  const { data: existingI } = await supabase.from("product_images").select("id, storage_path").eq("product_id", id);
  const keepI = new Set(images.filter((i) => i.id).map((i) => i.id));
  const removeI = (existingI ?? []).filter((i) => !keepI.has(i.id));
  if (removeI.length) {
    await supabase.from("product_images").delete().in("id", removeI.map((i) => i.id));
    const paths = removeI.map((i) => i.storage_path).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("product-images").remove(paths);
  }
  for (const [i, img] of images.entries()) {
    const data = { product_id: id, url: img.url, storage_path: img.storage_path, alt: img.alt?.trim() || null, sort_order: i };
    const { error } = img.id
      ? await supabase.from("product_images").update(data).eq("id", img.id)
      : await supabase.from("product_images").insert(data);
    if (error) return { ok: false, error: `Foto opslaan mislukt: ${error.message}` };
  }

  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true, id, slug };
}

export async function setProductFlag(id: string, flag: "is_published" | "is_sold_out" | "is_featured" | "is_new_arrival", value: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!["is_published", "is_sold_out", "is_featured", "is_new_arrival"].includes(flag)) return { ok: false, error: "Ongeldige actie." };
  const { error } = await supabase.from("products").update({ [flag]: value }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Deletes a product. Existing orders keep their copied product details. */
export async function deleteProduct(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { data: imgs } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  const paths = (imgs ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function updateStock(rows: { id: string; stock: number }[]): Promise<Result> {
  const { supabase } = await requireAdmin();
  for (const r of rows) {
    if (!Number.isInteger(r.stock) || r.stock < 0) return { ok: false, error: "Voorraad moet een heel getal van 0 of hoger zijn." };
  }
  for (const r of rows) {
    const { error } = await supabase.from("product_variants").update({ stock: r.stock }).eq("id", r.id);
    if (error) return { ok: false, error: error.message };
  }
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function updatePrices(input: {
  products: { id: string; price: string; sale_price: string }[];
  variants: { id: string; price: string; sale_price: string; productPrice: string }[];
}): Promise<Result> {
  const { supabase } = await requireAdmin();
  for (const p of input.products) {
    const price = money(p.price, true);
    const sale = money(p.sale_price, false);
    if (price === "invalid" || price === null || sale === "invalid") return { ok: false, error: "Een van de prijzen is ongeldig." };
    if (sale !== null && sale >= price) return { ok: false, error: "Een actieprijs moet lager zijn dan de verkoopprijs." };
    const { error } = await supabase.from("products").update({ price, sale_price: sale }).eq("id", p.id);
    if (error) return { ok: false, error: error.message };
  }
  for (const v of input.variants) {
    const price = money(v.price, false);
    const sale = money(v.sale_price, false);
    const base = money(v.productPrice, true);
    if (price === "invalid" || sale === "invalid") return { ok: false, error: "Een van de maatprijzen is ongeldig." };
    const compare = price ?? (base === "invalid" ? null : base);
    if (sale !== null && compare !== null && sale >= compare) return { ok: false, error: "Een actieprijs per maat moet lager zijn dan de prijs." };
    const { error } = await supabase.from("product_variants").update({ price, sale_price: sale }).eq("id", v.id);
    if (error) return { ok: false, error: error.message };
  }
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ============================================================ brands & cats

export interface BrandPayload {
  id?: string; name: string; slug?: string; description?: string; is_active?: boolean; sort_order?: number;
  header_image_url?: string | null; header_storage_path?: string | null;
}

export async function saveBrand(b: BrandPayload): Promise<Result<{ id: string; name: string; slug: string }>> {
  const { supabase } = await requireAdmin();
  const name = b.name?.trim();
  if (!name) return { ok: false, error: "Vul een merknaam in." };
  if (name.length > 80) return { ok: false, error: "De merknaam mag maximaal 80 tekens bevatten." };
  const slug = slugify(b.slug?.trim() || name);
  if (!slug) return { ok: false, error: "Vul een geldige URL-naam in (letters en cijfers)." };
  if (["nieuw", "admin"].includes(slug)) return { ok: false, error: "Deze URL-naam is niet toegestaan." };
  const headerUrl = b.header_image_url?.trim() || null;
  if (headerUrl && !headerUrl.startsWith("https://")) return { ok: false, error: "Ongeldige merkfoto." };

  let sortOrder = Number.isFinite(b.sort_order) ? Number(b.sort_order) : null;
  if (sortOrder === null && !b.id) {
    const { data: last } = await supabase.from("brands").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    sortOrder = (last?.sort_order ?? 0) + 1;
  }

  // Replacing or removing a header photo → delete the old file from storage.
  let oldPath: string | null = null;
  if (b.id) {
    const { data: old } = await supabase.from("brands").select("header_storage_path").eq("id", b.id).maybeSingle();
    if (old?.header_storage_path && old.header_storage_path !== (b.header_storage_path ?? null)) oldPath = old.header_storage_path;
  }

  const row: Record<string, unknown> = {
    name, slug, description: b.description?.trim() || null, is_active: b.is_active ?? true,
    header_image_url: headerUrl, header_storage_path: headerUrl ? b.header_storage_path ?? null : null,
  };
  if (sortOrder !== null) row.sort_order = sortOrder;

  const { data, error } = b.id
    ? await supabase.from("brands").update(row).eq("id", b.id).select("id").single()
    : await supabase.from("brands").insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Er bestaat al een merk met deze URL-naam. Kies een andere." };
    if (error.message?.includes("header_")) return { ok: false, error: "Voer eerst update-2-merken.sql uit in Supabase (zie README)." };
    return { ok: false, error: error.message };
  }
  if (oldPath) await supabase.storage.from("product-images").remove([oldPath]);
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true, id: data.id as string, name, slug };
}

/** Saves the brand order shown on the website (first in list = first on site). */
export async function reorderBrands(ids: string[]): Promise<Result> {
  const { supabase } = await requireAdmin();
  for (const [i, id] of ids.entries()) {
    const { error } = await supabase.from("brands").update({ sort_order: i + 1 }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  }
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Deletes a brand. Its products stay in the shop (without brand); past orders keep the brand name. */
export async function deleteBrand(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { data: brand } = await supabase.from("brands").select("header_storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (brand?.header_storage_path) await supabase.storage.from("product-images").remove([brand.header_storage_path]);
  refreshShop();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveCategory(c: { id?: string; name: string; slug?: string; sort_order?: number }): Promise<Result<{ id: string; name: string }>> {
  const { supabase } = await requireAdmin();
  const name = c.name?.trim();
  if (!name) return { ok: false, error: "Vul een categorienaam in." };
  const row = { name, slug: slugify(c.slug?.trim() || name), sort_order: Number.isFinite(c.sort_order) ? Number(c.sort_order) : 100 };
  const { data, error } = c.id
    ? await supabase.from("categories").update(row).eq("id", c.id).select("id").single()
    : await supabase.from("categories").insert(row).select("id").single();
  if (error) return { ok: false, error: error.code === "23505" ? "Er bestaat al een categorie met deze naam/URL." : error.message };
  refreshShop();
  return { ok: true, id: data.id as string, name };
}

export async function deleteCategory(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

// ================================================================ discount codes

export interface DiscountPayload {
  id?: string;
  code: string;
  kind: "percent" | "fixed";
  value: string | number;
  /** Empty = unlimited */
  max_uses: string | number | null;
}

/** Creates or updates a discount code. The owner chooses the name, amount and maximum number of uses. */
export async function saveDiscountCode(d: DiscountPayload): Promise<Result> {
  const { supabase } = await requireAdmin();
  const code = String(d.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, error: "Een kortingscode bestaat uit 3 tot 30 letters, cijfers, - of _ (zonder spaties). Bijvoorbeeld NOIR10." };
  if (d.kind !== "percent" && d.kind !== "fixed") return { ok: false, error: "Kies percentage of vast bedrag." };
  const value = money(d.value, true);
  if (value === "invalid" || value === null || value <= 0) return { ok: false, error: d.kind === "percent" ? "Vul een kortingspercentage in (bijvoorbeeld 10)." : "Vul een kortingsbedrag in euro's in (bijvoorbeeld 15)." };
  if (d.kind === "percent" && value > 100) return { ok: false, error: "Een percentage kan niet hoger zijn dan 100." };

  let maxUses: number | null = null;
  if (d.max_uses !== null && String(d.max_uses).trim() !== "") {
    const n = Number(String(d.max_uses).trim());
    if (!Number.isInteger(n) || n < 1 || n > 1_000_000) return { ok: false, error: "Het maximaal aantal keer gebruiken moet een heel getal van 1 of hoger zijn (of laat het leeg voor onbeperkt)." };
    maxUses = n;
  }

  const row = { code, kind: d.kind, value, max_uses: maxUses };
  const { error } = d.id
    ? await supabase.from("discount_codes").update(row).eq("id", d.id)
    : await supabase.from("discount_codes").insert(row);
  if (error) return { ok: false, error: error.code === "23505" ? `De code ${code} bestaat al.` : error.message };
  revalidatePath("/admin/kortingscodes");
  return { ok: true };
}

/** Deletes a code. Past orders keep the code name and the discount they received. */
export async function deleteDiscountCode(id: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/kortingscodes");
  return { ok: true };
}

// =================================================================== orders

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!STATUSES.includes(status)) return { ok: false, error: "Ongeldige status." };
  const { data, error } = await supabase.rpc("set_order_status", { p_order_id: id, p_status: status });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) {
    return { ok: false, error: data?.error === "insufficient_stock"
      ? "Er is niet genoeg voorraad meer om deze geannuleerde bestelling te heropenen."
      : "Status wijzigen mislukt." };
  }
  refreshShop(); // stock may have changed
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveInternalNotes(id: string, notes: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").update({ internal_notes: notes.slice(0, 5000) || null }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/bestellingen/${id}`);
  return { ok: true };
}

export async function markOrderSeen(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("orders").update({ is_seen: true }).eq("id", id).eq("is_seen", false);
  revalidatePath("/admin", "layout");
}

/** Polled by the dashboard to show new-order notifications. */
export async function getUnseenOrders(): Promise<{ count: number; latest: { order_number: string; customer_name: string } | null }> {
  const admin = await getAdmin();
  if (!admin) return { count: 0, latest: null };
  const { count } = await admin.supabase.from("orders").select("id", { count: "exact", head: true }).eq("is_seen", false);
  const { data } = await admin.supabase.from("orders").select("order_number, customer_name")
    .eq("is_seen", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return { count: count ?? 0, latest: data ?? null };
}

// ================================================================= settings

export async function saveSettings(s: Record<string, string>): Promise<Result> {
  const { supabase } = await requireAdmin();
  const allowed = ["announcement", "hero_title", "hero_subtitle", "contact_email", "whatsapp", "instagram", "snapchat", "contact_intro"];
  const row: Record<string, string | null> = {};
  for (const k of allowed) row[k] = (s[k] ?? "").trim().slice(0, 2000) || null;
  if (!row.hero_title) row.hero_title = "CURATED LUXURY. TIMELESS STYLE.";
  if (!row.hero_subtitle) row.hero_subtitle = "Ontdek een zorgvuldig samengestelde collectie luxe mode en eigentijdse streetwear.";
  if (row.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.contact_email)) return { ok: false, error: "Het e-mailadres is ongeldig." };
  const { error } = await supabase.from("site_settings").update({ ...row, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  refreshShop();
  return { ok: true };
}

export async function savePage(slug: string, title: string, body: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!PAGES[slug]) return { ok: false, error: "Onbekende pagina." };
  const { error } = await supabase.from("content_pages").upsert({
    slug, title: title.trim() || PAGES[slug].title, body: body.slice(0, 50000), updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${slug}`);
  return { ok: true };
}
