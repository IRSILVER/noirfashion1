import type { Product, ProductImage, ProductVariant } from "./types";

/**
 * Resolves the selling price exactly like the database function
 * public.effective_price(). Only prices entered by the admin are used.
 * - A size with its own price uses that price (and its own sale price, if any).
 * - Otherwise the product price applies, with the size's or product's sale price.
 */
export function resolvePrice(
  product: Pick<Product, "price" | "sale_price">,
  variant?: Pick<ProductVariant, "price" | "sale_price"> | null,
): { price: number; compareAt: number | null } {
  const vPrice = variant?.price != null ? Number(variant.price) : null;
  const vSale = variant?.sale_price != null ? Number(variant.sale_price) : null;
  if (vPrice != null) {
    return { price: vSale ?? vPrice, compareAt: vSale != null && vSale < vPrice ? vPrice : null };
  }
  const base = Number(product.price);
  const sale = vSale ?? (product.sale_price != null ? Number(product.sale_price) : null);
  return { price: sale ?? base, compareAt: sale != null && sale < base ? base : null };
}

export function totalStock(product: Pick<Product, "variants">) {
  return product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

export function isAvailable(product: Pick<Product, "variants" | "is_sold_out">) {
  return !product.is_sold_out && totalStock(product) > 0;
}

/** Lowest current price over sizes in stock (or all sizes when sold out). */
export function priceRange(product: Product) {
  const pool = product.variants.some((v) => v.stock > 0)
    ? product.variants.filter((v) => v.stock > 0)
    : product.variants;
  if (pool.length === 0) return { ...resolvePrice(product, null), varies: false };
  const prices = pool.map((v) => resolvePrice(product, v));
  const min = prices.reduce((a, b) => (b.price < a.price ? b : a));
  const varies = prices.some((p) => p.price !== min.price);
  return { ...min, varies };
}

// ---------------------------------------------------------------- colours

/** Distinct colours of a product, in the order the admin entered them. */
export function productColors(product: Pick<Product, "variants">): string[] {
  const out: string[] = [];
  for (const v of product.variants) if (v.color && !out.includes(v.color)) out.push(v.color);
  return out;
}

/** True when at least one size of this colour is in stock. */
export function colorInStock(product: Pick<Product, "variants" | "is_sold_out">, color: string) {
  return !product.is_sold_out && product.variants.some((v) => v.color === color && v.stock > 0);
}

/** Photos to show for a colour: that colour's own photos first, then the shared ones. */
export function imagesForColor(images: ProductImage[], color: string | null): ProductImage[] {
  if (!color) return images;
  const own = images.filter((i) => i.color === color);
  const shared = images.filter((i) => !i.color);
  const list = [...own, ...shared];
  return list.length ? list : images;
}

/** "Zwart · M" for products with colours, "M" for products without. Stored in carts and orders. */
export const variantLabel = (v: { size: string; color?: string | null }) => (v.color ? `${v.color} · ${v.size}` : v.size);
