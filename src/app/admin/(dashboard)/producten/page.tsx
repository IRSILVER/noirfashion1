import Image from "next/image";
import Link from "next/link";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { Empty, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { priceRange, totalStock } from "@/lib/pricing";

export const metadata = { title: "Producten beheren" };

const FILTERS = [
  ["", "Alle"], ["online", "Online"], ["verborgen", "Verborgen"], ["voorraad", "Op voorraad"], ["uitverkocht", "Uitverkocht"],
] as const;

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "", q } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  let products = (data ?? []).map(normalizeProduct);
  const soldOut = (p: (typeof products)[number]) => p.is_sold_out || totalStock(p) === 0;
  if (filter === "online") products = products.filter((p) => p.is_published);
  if (filter === "verborgen") products = products.filter((p) => !p.is_published);
  if (filter === "voorraad") products = products.filter((p) => !soldOut(p));
  if (filter === "uitverkocht") products = products.filter(soldOut);
  if (q) products = products.filter((p) => `${p.name} ${p.brand?.name ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Producten beheren" description="Bewerk, verberg, markeer als uitverkocht of verwijder producten. Bestellingen blijven altijd bewaard."
        action={<Link href="/admin/producten/nieuw" className="a-btn a-btn-dark">+ Product toevoegen</Link>} />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {FILTERS.map(([v, label]) => (
            <Link key={v} href={v ? `/admin/producten?filter=${v}` : "/admin/producten"} className={`a-btn ${filter === v ? "a-btn-dark" : "a-btn-ghost"} min-h-9 px-3 text-xs`}>{label}</Link>
          ))}
        </div>
        <form className="md:ml-auto">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Zoek product of merk…" className="a-input md:w-64" />
        </form>
      </div>

      {products.length === 0 ? (
        <Empty>Geen producten gevonden. <Link href="/admin/producten/nieuw" className="underline">Voeg je eerste product toe</Link>.</Empty>
      ) : (
        <ul className="a-card divide-y divide-line">
          {products.map((p) => {
            const stock = totalStock(p);
            const { price, compareAt, varies } = priceRange(p);
            return (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Link href={`/admin/producten/${p.id}`} className="flex flex-1 items-center gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                    {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="64px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] text-taupe">Geen foto</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-[0.1em] text-champagne">{p.brand?.name ?? "Geen merk"}</p>
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="mt-0.5 text-xs text-taupe">
                      {varies && "vanaf "}{formatPrice(price)}{compareAt && <span className="ml-1 line-through">{formatPrice(compareAt)}</span>}
                      {" · "}voorraad {stock}{" · "}{p.variants.map((v) => v.size).join(", ") || "geen maten"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Tag tone={p.is_published ? "green" : "grey"}>{p.is_published ? "Online" : "Verborgen"}</Tag>
                      {(p.is_sold_out || stock === 0) && <Tag tone="red">Uitverkocht</Tag>}
                      {p.is_featured && <Tag tone="gold">Uitgelicht</Tag>}
                      {p.is_new_arrival && <Tag tone="gold">Nieuw binnen</Tag>}
                    </div>
                  </div>
                </Link>
                <ProductRowActions id={p.id} slug={p.slug} name={p.name} published={p.is_published} soldOut={p.is_sold_out} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Tag({ tone, children }: { tone: "green" | "grey" | "red" | "gold"; children: React.ReactNode }) {
  const c = { green: "bg-emerald-50 text-emerald-800", grey: "bg-stone-100 text-stone-600", red: "bg-red-50 text-red-800", gold: "bg-champagne/15 text-espresso" }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${c}`}>{children}</span>;
}
