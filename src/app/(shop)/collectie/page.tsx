import type { Metadata } from "next";
import { EmptyState } from "@/components/shop/EmptyState";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { availableSizes, filterProducts, getBrands, getCategories, getPublishedProducts, parseShopQuery } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collectie",
  description: "Bekijk de volledige collectie luxe mode, designerkleding en premium streetwear van NOIR FASHION.",
  alternates: { canonical: "/collectie" },
};

export default async function CollectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseShopQuery(await searchParams);
  const [products, brands, categories] = await Promise.all([getPublishedProducts(), getBrands(), getCategories()]);
  const list = filterProducts(products, query);

  const brandOpts = brands
    .map((b) => ({ value: b.slug, label: b.name, count: products.filter((p) => p.brand?.id === b.id).length }))
    .filter((b) => b.count > 0);
  const catOpts = categories
    .map((c) => ({ value: c.slug, label: c.name, count: products.filter((p) => p.category?.id === c.id).length }))
    .filter((c) => c.count > 0);

  const title = query.nieuw === "1" ? "Nieuw binnen" : query.q ? `Zoekresultaten` : "Collectie";

  return (
    <div className="container-luxe py-14 md:py-20">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow">NOIR FASHION</p>
        <h1 className="heading-display mt-4 text-5xl md:text-6xl">{title}</h1>
        <p className="mt-5 text-sm leading-relaxed text-brown">
          Een zorgvuldig samengestelde selectie van gevestigde luxe-, designer- en streetwearmerken. Bij ieder item vermelden wij eerlijk de staat.
        </p>
      </header>

      {products.length === 0 ? (
        <EmptyState title="De collectie wordt samengesteld" text="Er zijn nog geen producten online. Kom binnenkort terug voor de eerste stukken." href="/" cta="Terug naar home" />
      ) : (
        <ShopFilters basePath="/collectie" query={query} brands={brandOpts} categories={catOpts}
          sizes={availableSizes(products)} total={list.length}>
          {list.length > 0 ? <ProductGrid products={list} priorityCount={4} /> : (
            <EmptyState title="Geen items gevonden" text="Pas je filters aan of bekijk de volledige collectie." href="/collectie" cta="Filters wissen" />
          )}
        </ShopFilters>
      )}
    </div>
  );
}

