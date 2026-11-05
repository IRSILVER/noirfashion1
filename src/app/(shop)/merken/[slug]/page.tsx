import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { availableSizes, filterProducts, getBrands, getCategories, getPublishedProducts, parseShopQuery } from "@/lib/catalog";
import { isAvailable } from "@/lib/pricing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

// Pages for brands added later in the dashboard are created automatically on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  if (!brand) return { title: "Merk niet gevonden" };
  const description = brand.description || `Shop ${brand.name} bij NOIR FASHION: een zorgvuldig geselecteerde collectie, met bij elk item de eerlijke staat vermeld.`;
  return {
    title: `${brand.name} kopen`,
    description,
    alternates: { canonical: `/merken/${brand.slug}` },
    openGraph: { title: `${brand.name} | NOIR FASHION`, description, images: brand.header_image_url ? [{ url: brand.header_image_url }] : undefined },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [brands, all, categories] = await Promise.all([getBrands(), getPublishedProducts(), getCategories()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  const query = { ...parseShopQuery(await searchParams), merk: undefined };
  const products = all.filter((p) => p.brand?.id === brand.id);
  const list = filterProducts(products, query);
  const inStock = products.filter(isAvailable).length;
  const catOpts = categories
    .map((c) => ({ value: c.slug, label: c.name, count: products.filter((p) => p.category?.id === c.id).length }))
    .filter((c) => c.count > 0);
  const others = brands.filter((b) => b.id !== brand.id).slice(0, 6);
  const countLabel = products.length === 0 ? "Binnenkort beschikbaar" : `${inStock} van ${products.length} ${products.length === 1 ? "item" : "items"} beschikbaar`;

  return (
    <>
      {/* BRAND HEADER */}
      {brand.header_image_url ? (
        <header className="relative isolate flex min-h-[340px] items-end overflow-hidden bg-noir md:min-h-[460px]">
          <Image src={brand.header_image_url} alt={brand.name} fill priority sizes="100vw" className="-z-10 object-cover opacity-75" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-noir/85 via-noir/30 to-noir/10" />
          <div className="container-luxe pb-12 pt-24 text-ivory md:pb-16">
            <Crumbs name={brand.name} light />
            <h1 className="heading-display mt-5 text-5xl md:text-7xl lg:text-8xl">{brand.name}</h1>
            <p className="mt-5 text-[0.68rem] uppercase tracking-[0.28em] text-champagne-light">{countLabel}</p>
          </div>
        </header>
      ) : (
        <header className="relative overflow-hidden border-b border-line bg-sand/60">
          <Image src="/brand/monogram-transparent.png" alt="" width={520} height={427} aria-hidden
            className="pointer-events-none absolute -right-16 top-1/2 w-[340px] -translate-y-1/2 opacity-[0.07] md:w-[520px]" />
          <div className="container-luxe relative py-16 md:py-24">
            <Crumbs name={brand.name} />
            <p className="eyebrow mt-10">Merk</p>
            <h1 className="heading-display mt-4 text-5xl md:text-7xl lg:text-8xl">{brand.name}</h1>
            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.28em] text-taupe">{countLabel}</p>
          </div>
        </header>
      )}

      <div className="container-luxe py-12 md:py-16">
        {brand.description && (
          <p className="mb-12 max-w-2xl font-serif text-xl leading-relaxed text-brown md:text-2xl">{brand.description}</p>
        )}

        {products.length === 0 ? (
          <EmptyState title={`Nog geen ${brand.name} beschikbaar`}
            text="Er zijn op dit moment nog geen items van dit merk online. Nieuwe stukken worden regelmatig toegevoegd — bekijk intussen de andere merken."
            href="/merken" cta="Alle merken" />
        ) : (
          <ShopFilters basePath={`/merken/${brand.slug}`} query={query} brands={[]} categories={catOpts}
            sizes={availableSizes(products)} total={list.length} hideBrand>
            {list.length > 0 ? <ProductGrid products={list} priorityCount={4} /> : (
              <EmptyState title="Geen items gevonden" text="Pas je filters aan." href={`/merken/${brand.slug}`} cta="Filters wissen" />
            )}
          </ShopFilters>
        )}

        <p className="mt-16 text-xs text-taupe">NOIR FASHION is geen officiële verkoper of partner van {brand.name}. De merknaam wordt alleen gebruikt om het product te beschrijven.</p>

        {others.length > 0 && (
          <section className="mt-20 border-t border-line pt-14">
            <p className="eyebrow">Ontdek ook</p>
            <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {others.map((b) => (
                <li key={b.id}><Link href={`/merken/${b.slug}`} className="link-underline font-serif text-xl md:text-2xl">{b.name}</Link></li>
              ))}
              <li><Link href="/merken" className="link-underline text-[0.68rem] uppercase tracking-[0.24em] text-champagne">Alle merken →</Link></li>
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Crumbs({ name, light = false }: { name: string; light?: boolean }) {
  return (
    <nav aria-label="Kruimelpad" className={`text-[0.62rem] uppercase tracking-[0.24em] ${light ? "text-ivory/70" : "text-taupe"}`}>
      <Link href="/merken" className={light ? "hover:text-ivory" : "hover:text-espresso"}>Merken</Link>
      <span className="mx-2">/</span><span className={light ? "text-ivory" : "text-espresso"}>{name}</span>
    </nav>
  );
}
