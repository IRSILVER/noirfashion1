import type { Metadata } from "next";
import Link from "next/link";
import { getBrands, getPublishedProducts } from "@/lib/catalog";
import { isAvailable } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Merken",
  description: "Shop op merk: Fear of God Essentials, Hermès, ALO Yoga, Acne Studios, Stone Island, Ralph Lauren, Moncler, Casablanca, Dior, Canada Goose en meer.",
  alternates: { canonical: "/merken" },
};

export default async function BrandsPage() {
  const [brands, products] = await Promise.all([getBrands(), getPublishedProducts()]);
  const counts = new Map<string, number>();
  products.filter(isAvailable).forEach((p) => p.brand && counts.set(p.brand.id, (counts.get(p.brand.id) ?? 0) + 1));
  const sorted = [...brands].sort((a, b) => Number(counts.has(b.id)) - Number(counts.has(a.id)));

  return (
    <div className="container-luxe py-14 md:py-20">
      <header className="mb-16 max-w-2xl">
        <p className="eyebrow">Shop op merk</p>
        <h1 className="heading-display mt-4 text-5xl md:text-6xl">Merken</h1>
        <p className="mt-5 text-sm leading-relaxed text-brown">
          Een selectie van gevestigde luxe-, designer- en streetwearmerken. NOIR FASHION is geen officiële verkoper of partner van deze merken.
        </p>
      </header>
      <ul className="border-t border-line">
        {sorted.map((b) => {
          const n = counts.get(b.id) ?? 0;
          return (
            <li key={b.id}>
              <Link href={`/merken/${b.slug}`} className="group flex items-baseline justify-between gap-6 border-b border-line py-7 transition-colors md:py-9">
                <span className="heading-display text-3xl transition-all duration-500 group-hover:translate-x-3 group-hover:text-champagne md:text-5xl">{b.name}</span>
                <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.26em] text-taupe">
                  {n > 0 ? `${n} ${n === 1 ? "item" : "items"}` : "Binnenkort"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
