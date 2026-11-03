import type { Metadata } from "next";
import Image from "next/image";
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

  return (
    <div className="container-luxe py-14 md:py-20">
      <header className="mb-14 max-w-2xl">
        <p className="eyebrow">Shop op merk</p>
        <h1 className="heading-display mt-4 text-5xl md:text-6xl">Merken</h1>
        <p className="mt-5 text-sm leading-relaxed text-brown">
          Een selectie van gevestigde luxe-, designer- en streetwearmerken. NOIR FASHION is geen officiële verkoper of partner van deze merken.
        </p>
      </header>

      {brands.length === 0 ? (
        <p className="border border-line bg-cream/40 px-6 py-16 text-center text-sm text-brown">De merken worden binnenkort toegevoegd.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const n = counts.get(b.id) ?? 0;
            return (
              <li key={b.id}>
                <Link href={`/merken/${b.slug}`} className="group relative flex aspect-[16/10] items-end overflow-hidden bg-sand">
                  {b.header_image_url ? (
                    <>
                      <Image src={b.header_image_url} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-noir/75 via-noir/15 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 border border-line transition-colors duration-500 group-hover:bg-noir" />
                  )}
                  <div className={`relative w-full p-6 ${b.header_image_url ? "text-ivory" : "text-espresso transition-colors duration-500 group-hover:text-ivory"}`}>
                    <p className="heading-display text-3xl md:text-4xl">{b.name}</p>
                    <p className={`mt-2 text-[0.62rem] uppercase tracking-[0.26em] ${b.header_image_url ? "text-champagne-light" : "text-taupe group-hover:text-champagne-light"}`}>
                      {n > 0 ? `${n} ${n === 1 ? "item" : "items"}` : "Binnenkort"} <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
