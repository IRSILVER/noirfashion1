import "server-only";
import { getPublicClient } from "./supabase/public";
import { isAvailable, priceRange } from "./pricing";
import type { Brand, Category, ContentPage, Product, SiteSettings } from "./types";

export const PRODUCT_SELECT = `
  id, name, slug, description, brand_id, category_id, condition, price, sale_price,
  is_published, is_featured, is_new_arrival, is_sold_out, created_at, updated_at,
  brand:brands(id, name, slug),
  category:categories(id, name, slug),
  images:product_images(id, product_id, url, storage_path, alt, sort_order),
  variants:product_variants(id, product_id, size, stock, price, sale_price, sort_order)
`;

const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE SIZE"];
export function compareSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  const na = parseFloat(a.replace(",", "."));
  const nb = parseFloat(b.replace(",", "."));
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, "nl");
}

/** Converts a raw Supabase row into a clean Product (numbers, sorted images/sizes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProduct(row: any): Product {
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
  return {
    ...row,
    price: Number(row.price),
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
    brand: one(row.brand),
    category: one(row.category),
    images: [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    variants: [...(row.variants ?? [])]
      .map((v) => ({
        ...v,
        price: v.price != null ? Number(v.price) : null,
        sale_price: v.sale_price != null ? Number(v.sale_price) : null,
      }))
      .sort((a, b) => a.sort_order - b.sort_order || compareSizes(a.size, b.size)),
  };
}

export async function getPublishedProducts(): Promise<Product[]> {
  const db = getPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("getPublishedProducts", error.message);
    return [];
  }
  return (data ?? []).map(normalizeProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getPublicClient();
  if (!db) return null;
  const { data, error } = await db
    .from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) console.error("getProductBySlug", error.message);
  return data ? normalizeProduct(data) : null;
}

export async function getBrands(): Promise<Brand[]> {
  const db = getPublicClient();
  if (!db) return [];
  const { data } = await db.from("brands").select("*").order("sort_order").order("name");
  return (data ?? []) as Brand[];
}

export async function getCategories(): Promise<Category[]> {
  const db = getPublicClient();
  if (!db) return [];
  const { data } = await db.from("categories").select("*").order("sort_order").order("name");
  return (data ?? []) as Category[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  announcement: null,
  hero_title: "CURATED LUXURY. TIMELESS STYLE.",
  hero_subtitle: "Ontdek een zorgvuldig samengestelde collectie luxe mode en eigentijdse streetwear.",
  contact_email: null, whatsapp: null, instagram: null, snapchat: null, contact_intro: null,
};

export async function getSettings(): Promise<SiteSettings> {
  const db = getPublicClient();
  if (!db) return DEFAULT_SETTINGS;
  const { data } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export async function getContentPage(slug: string): Promise<ContentPage | null> {
  const db = getPublicClient();
  if (!db) return null;
  const { data } = await db.from("content_pages").select("*").eq("slug", slug).maybeSingle();
  return (data as ContentPage) ?? null;
}

// ---------- Shop filtering (done on the server, with the admin's prices) ----------

export interface ShopQuery {
  q?: string;
  merk?: string;
  categorie?: string;
  maat?: string;
  min?: string;
  max?: string;
  sorteer?: string;
  beschikbaar?: string;
  nieuw?: string;
}

const QUERY_KEYS = ["q", "merk", "categorie", "maat", "min", "max", "sorteer", "beschikbaar", "nieuw"] as const;

/** Reads only known, single-value filter params from the URL. */
export function parseShopQuery(sp: Record<string, string | string[] | undefined>): ShopQuery {
  const out: ShopQuery = {};
  for (const k of QUERY_KEYS) {
    const v = sp[k];
    const s = (Array.isArray(v) ? v[0] : v)?.slice(0, 200);
    if (s) out[k] = s;
  }
  return out;
}

export function filterProducts(products: Product[], query: ShopQuery) {
  const q = query.q?.trim().toLowerCase();
  const brands = query.merk?.split(",").filter(Boolean) ?? [];
  const cats = query.categorie?.split(",").filter(Boolean) ?? [];
  const sizes = query.maat?.split(",").filter(Boolean) ?? [];
  const min = query.min ? Number(query.min) : null;
  const max = query.max ? Number(query.max) : null;

  let list = products.filter((p) => {
    if (q && !`${p.name} ${p.brand?.name ?? ""} ${p.category?.name ?? ""}`.toLowerCase().includes(q)) return false;
    if (brands.length && !(p.brand && brands.includes(p.brand.slug))) return false;
    if (cats.length && !(p.category && cats.includes(p.category.slug))) return false;
    if (sizes.length && !p.variants.some((v) => sizes.includes(v.size) && v.stock > 0)) return false;
    if (query.beschikbaar === "1" && !isAvailable(p)) return false;
    if (query.nieuw === "1" && !p.is_new_arrival) return false;
    const price = priceRange(p).price;
    if (min != null && !isNaN(min) && price < min) return false;
    if (max != null && !isNaN(max) && price > max) return false;
    return true;
  });

  const byPrice = (p: Product) => priceRange(p).price;
  if (query.sorteer === "prijs-oplopend") list = [...list].sort((a, b) => byPrice(a) - byPrice(b));
  else if (query.sorteer === "prijs-aflopend") list = [...list].sort((a, b) => byPrice(b) - byPrice(a));
  // default: newest first (already ordered by the database)

  // Available items first, sold-out items last — keeps the shop feeling alive.
  return [...list].sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)));
}

export function availableSizes(products: Product[]) {
  const set = new Set<string>();
  products.forEach((p) => p.variants.forEach((v) => v.stock > 0 && set.add(v.size)));
  return [...set].sort(compareSizes);
}
