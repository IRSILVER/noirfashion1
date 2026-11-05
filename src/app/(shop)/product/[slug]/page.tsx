import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/shop/AddToCart";
import { ColorProvider } from "@/components/shop/ColorContext";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductGrid } from "@/components/shop/ProductCard";
import { getProductBySlug, getPublishedProducts } from "@/lib/catalog";
import { CONDITION_LABELS } from "@/lib/format";
import { colorInStock, isAvailable, priceRange, productColors } from "@/lib/pricing";
import { PRIVATE_ARRANGEMENT_TEXT, SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product niet gevonden" };
  const title = `${p.brand ? `${p.brand.name} ` : ""}${p.name}`;
  const description = (p.description || `${title} — ${CONDITION_LABELS[p.condition]}. Bij NOIR FASHION.`).slice(0, 160);
  return {
    title, description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, type: "website", images: p.images[0] ? [{ url: p.images[0].url }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await getPublishedProducts();
  const related = all
    .filter((p) => p.id !== product.id && isAvailable(p))
    .map((p) => ({ p, score: (p.brand?.id === product.brand?.id ? 2 : 0) + (p.category?.id === product.category?.id ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);

  const available = isAvailable(product);
  const firstColor = productColors(product).find((c) => colorInStock(product, c)) ?? productColors(product)[0] ?? null;
  const { price } = priceRange(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.id,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "EUR",
      price: price.toFixed(2),
      availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: product.condition.startsWith("new") ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-luxe py-8 md:py-14">
        <nav aria-label="Kruimelpad" className="mb-8 text-[0.62rem] uppercase tracking-[0.24em] text-taupe">
          <Link href="/merken" className="hover:text-espresso">Merken</Link>
          {product.brand && (<><span className="mx-2">/</span><Link href={`/merken/${product.brand.slug}`} className="hover:text-espresso">{product.brand.name}</Link></>)}
          <span className="mx-2">/</span><span className="text-espresso">{product.name}</span>
        </nav>

        <ColorProvider initial={firstColor}>
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-32 lg:self-start">
            {product.brand && (
              <Link href={`/merken/${product.brand.slug}`} className="eyebrow hover:text-espresso">{product.brand.name}</Link>
            )}
            <h1 className="heading-display mt-4 text-4xl md:text-5xl">{product.name}</h1>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-taupe">
              <div><dt className="inline">Staat: </dt><dd className="inline text-espresso">{CONDITION_LABELS[product.condition]}</dd></div>
              {product.category && <div><dt className="inline">Categorie: </dt><dd className="inline text-espresso">{product.category.name}</dd></div>}
              <div><dt className="inline">Beschikbaarheid: </dt><dd className={`inline ${available ? "text-emerald-800" : "text-[#8b3a2a]"}`}>{available ? "Op voorraad" : "Uitverkocht"}</dd></div>
            </dl>

            <div className="mt-10 border-t border-line pt-10">
              <AddToCart product={product} />
            </div>

            <p className="mt-6 bg-cream px-5 py-4 text-xs leading-relaxed text-brown">
              <strong className="font-medium text-espresso">Geen online betaling.</strong> {PRIVATE_ARRANGEMENT_TEXT}
            </p>

            <div className="mt-10 divide-y divide-line border-y border-line">
              {product.description && (
                <details open className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[0.68rem] uppercase tracking-[0.24em]">Beschrijving<span className="transition-transform group-open:rotate-45">+</span></summary>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-brown">{product.description}</p>
                </details>
              )}
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[0.68rem] uppercase tracking-[0.24em]">Bestellen & betalen<span className="transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-4 text-sm leading-relaxed text-brown">Je plaatst je bestelling zonder online te betalen. Daarna nemen wij persoonlijk contact met je op. De betaling verloopt via Tikkie of contant.</p>
              </details>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[0.68rem] uppercase tracking-[0.24em]">Levering of afhalen<span className="transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-4 text-sm leading-relaxed text-brown">Levering of afhaling en eventuele kosten spreken we persoonlijk met je af. <Link href="/verzending" className="underline underline-offset-4">Meer informatie</Link>.</p>
              </details>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[0.68rem] uppercase tracking-[0.24em]">Maat & authenticiteit<span className="transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-4 text-sm leading-relaxed text-brown">
                  Bekijk de <Link href="/maattabel" className="underline underline-offset-4">maattabel</Link> en lees hoe wij omgaan met <Link href="/authenticiteit" className="underline underline-offset-4">authenticiteit</Link>.
                  NOIR FASHION is geen officiële verkoper of partner van {product.brand?.name ?? "dit merk"}.
                </p>
              </details>
            </div>
          </div>
        </div>
        </ColorProvider>

        {related.length > 0 && (
          <section className="mt-28 border-t border-line pt-20">
            <p className="eyebrow">Misschien ook iets voor jou</p>
            <h2 className="heading-display mb-12 mt-4 text-4xl">Gerelateerde producten</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}
