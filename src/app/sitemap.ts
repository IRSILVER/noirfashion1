import type { MetadataRoute } from "next";
import { getBrands, getPublishedProducts } from "@/lib/catalog";
import { PAGES } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([getPublishedProducts(), getBrands()]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/collectie`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/merken`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...Object.keys(PAGES).map((slug) => ({ url: `${SITE_URL}/${slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...brands.map((b) => ({ url: `${SITE_URL}/merken/${b.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
