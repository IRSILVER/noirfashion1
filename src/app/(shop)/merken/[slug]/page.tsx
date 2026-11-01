import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { availableSizes, filterProducts, getBrands, getCategories, getPublishedProducts, parseShopQuery } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  if (!brand) return { title: "Merk niet gevonden" };
  return {
    title: brand.name,
    description: brand.description || `Bekijk de beschikbare items van ${brand.name} bij NOIR FASHION.`,
    alternates: { canonical: `/merken/${brand.slug}` },
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
  const catOpts = categories
    .map((c) => ({ value: c.slug, label: c.name, count: products.filter((p) => p.category?.id === c.id).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="container-luxe py-14 md:py-20">
      <nav aria-label="Kruimelpad" className="mb-10 text-[0.65rem] uppercase tracking-[0.24em] text-taupe">
        <Link href="/merken" className="hover:text-espresso">Merken</Link> <span className="mx-2">/</span> <span className="text-espresso">{brand.name}</span>
      </nav>
      <header className="mb-14 max-w-2xl">
        <h1 className="heading-display text-5xl md:text-7xl">{brand.name}</h1>
        {brand.description && <p className="mt-6 text-sm leading-relaxed text-brown">{brand.description}</p>}
      </header>
      {products.length === 0 ? (
        <EmptyState title={`Binnenkort ${brand.name}`} text="Er zijn op dit moment geen items van dit merk beschikbaar. Bekijk de rest van de collectie."
          href="/collectie" cta="Naar de collectie" />
      ) : (
        <ShopFilters basePath={`/merken/${brand.slug}`} query={query} brands={[]} categories={catOpts}
          sizes={availableSizes(products)} total={list.length} hideBrand>
          {list.length > 0 ? <ProductGrid products={list} priorityCount={4} /> : (
            <EmptyState title="Geen items gevonden" text="Pas je filters aan." href={`/merken/${brand.slug}`} cta="Filters wissen" />
          )}
        </ShopFilters>
      )}
    </div>
  );
}
