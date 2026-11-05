import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { ProductGrid } from "@/components/shop/ProductCard";
import { getBrands, getCategories, getPublishedProducts, getSettings } from "@/lib/catalog";
import { isAvailable } from "@/lib/pricing";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export default async function HomePage() {
  const [products, brands, categories, settings] = await Promise.all([
    getPublishedProducts(), getBrands(), getCategories(), getSettings(),
  ]);
  const available = products.filter(isAvailable);
  const newArrivals = (available.filter((p) => p.is_new_arrival).length ? available.filter((p) => p.is_new_arrival) : available).slice(0, 8);
  const featured = available.filter((p) => p.is_featured).slice(0, 4);

  const brandCounts = new Map<string, number>();
  products.forEach((p) => p.brand && brandCounts.set(p.brand.id, (brandCounts.get(p.brand.id) ?? 0) + 1));
  const brandsWithProducts = brands.filter((b) => brandCounts.has(b.id));
  const shownBrands = brandsWithProducts.length > 0 ? brandsWithProducts : brands;

  const catCounts = new Map<string, number>();
  products.forEach((p) => p.category && catCounts.set(p.category.id, (catCounts.get(p.category.id) ?? 0) + 1));
  const shownCategories = categories.filter((c) => catCounts.has(c.id)).length > 0
    ? categories.filter((c) => catCounts.has(c.id)) : categories.slice(0, 6);

  const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/brand/noir-fashion-logo.png` };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-luxe grid items-center gap-12 py-14 md:grid-cols-[1.05fr_1fr] md:py-20 lg:py-28">
          <div className="animate-fade-up">
            <p className="eyebrow">Luxe mode · Designer · Premium streetwear</p>
            <h1 className="heading-display mt-7 text-[2.9rem] uppercase sm:text-6xl lg:text-[5.4rem]">
              {settings.hero_title.split(". ").map((line, i, arr) => (
                <span key={i} className="block">{line}{i < arr.length - 1 ? "." : ""}</span>
              ))}
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-brown md:text-lg">{settings.hero_subtitle}</p>
            <div className="mt-11 flex flex-col gap-3 sm:flex-row">
              <Link href="/merken" className="btn btn-dark">Bekijk de merken <ArrowIcon /></Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-3 border border-champagne/40 md:-inset-5" aria-hidden />
            <Image src="/brand/noir-fashion-logo.png" alt="NOIR FASHION logo" width={1254} height={1254} priority
              sizes="(min-width:768px) 560px, 100vw" className="relative h-auto w-full shadow-[0_40px_80px_-40px_rgba(43,33,26,0.45)]" />
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b border-line bg-cream/60">
        <div className="container-luxe grid grid-cols-2 gap-y-8 py-10 text-center md:grid-cols-4">
          {[
            ["Zorgvuldig geselecteerd", "Alleen stukken die wij zelf zouden dragen"],
            ["Eerlijke staat", "Bij elk item duidelijk vermeld"],
            ["Persoonlijk contact", "Wij nemen na je bestelling contact op"],
            ["Geen online betaling", "Betalen via Tikkie of contant"],
          ].map(([t, s]) => (
            <div key={t} className="px-3">
              <p className="font-serif text-lg md:text-xl">{t}</p>
              <p className="mt-1.5 text-xs text-taupe">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-luxe py-24 md:py-32">
        <SectionHead eyebrow="Net binnen" title="Nieuw binnen" href="/zoeken?nieuw=1" cta="Bekijk alles" />
        {newArrivals.length > 0 ? (
          <ProductGrid products={newArrivals} priorityCount={2} />
        ) : (
          <div className="border border-line bg-cream/40 px-6 py-20 text-center">
            <p className="heading-display text-3xl md:text-4xl">De eerste stukken komen eraan</p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-brown">
              Onze collectie wordt op dit moment samengesteld. Kom snel terug of volg ons voor de eerste drop.
            </p>
            <Link href="/contact" className="btn btn-outline mt-10">Neem contact op</Link>
          </div>
        )}
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="bg-sand/60 py-24 md:py-32">
          <div className="container-luxe">
            <SectionHead eyebrow="Onze selectie" title="Uitgelichte producten" href="/merken" cta="Bekijk de merken" />
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {/* BRANDS */}
      <section className="container-luxe py-24 md:py-32">
        <SectionHead eyebrow="Shop op merk" title="Merken" href="/merken" cta="Alle merken" />
        <div className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-5">
          {shownBrands.map((b) => (
            <Link key={b.id} href={`/merken/${b.slug}`}
              className="group relative flex aspect-[4/3] flex-col items-center justify-center border-b border-r border-line px-4 text-center transition-colors duration-500 hover:bg-noir">
              <span className="font-serif text-xl leading-tight text-espresso transition-colors duration-500 group-hover:text-ivory md:text-2xl">{b.name}</span>
              <span className="mt-3 text-[0.6rem] uppercase tracking-[0.26em] text-taupe transition-colors duration-500 group-hover:text-champagne-light">
                {brandCounts.get(b.id) ? `${brandCounts.get(b.id)} ${brandCounts.get(b.id) === 1 ? "item" : "items"}` : "Binnenkort"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {shownCategories.length > 0 && (
        <section className="border-t border-line bg-ivory py-24 md:py-32">
          <div className="container-luxe">
            <SectionHead eyebrow="Ontdek" title="Categorieën" href="/merken" cta="Bekijk de merken" />
            <div className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {shownCategories.map((c, i) => (
                <Link key={c.id} href={`/zoeken?categorie=${c.slug}`}
                  className="group flex items-end justify-between border-b border-r border-line bg-ivory px-7 py-10 transition-colors duration-500 hover:bg-cream">
                  <div>
                    <span className="font-serif text-sm text-champagne">{String(i + 1).padStart(2, "0")}</span>
                    <p className="heading-display mt-2 text-3xl">{c.name}</p>
                  </div>
                  <ArrowIcon className="size-5 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="bg-noir py-24 text-ivory md:py-32">
        <div className="container-luxe grid gap-14 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Zo werkt bestellen</p>
            <h2 className="heading-display mt-6 text-4xl md:text-5xl">Persoonlijk, zonder online betaling</h2>
          </div>
          <ol className="grid gap-10 sm:grid-cols-3">
            {[
              ["Kies je items", "Voeg je favoriete stukken toe aan je winkelwagen."],
              ["Plaats je bestelling", "Alleen je naam en telefoonnummer zijn nodig."],
              ["Wij nemen contact op", "Samen spreken we de betaling (Tikkie of contant) en levering of afhaling af."],
            ].map(([t, s], i) => (
              <li key={t} className="border-t border-ivory/20 pt-6">
                <span className="font-serif text-3xl text-champagne-light">{i + 1}</span>
                <p className="mt-4 font-serif text-xl">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-ivory/65">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href: string; cta: string }) {
  return (
    <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="heading-display mt-4 text-4xl md:text-5xl">{title}</h2>
      </div>
      <Link href={href} className="link-underline hidden shrink-0 items-center gap-2 text-[0.68rem] uppercase tracking-[0.24em] sm:flex">
        {cta} <ArrowIcon className="size-3.5" />
      </Link>
    </div>
  );
}
