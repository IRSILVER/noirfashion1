import Link from "next/link";
import { Empty, PageHeader, StatCard, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata = { title: "Overzicht" };

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("id, order_number, customer_name, status, total, created_at, is_seen").order("created_at", { ascending: false }).limit(1000),
    supabase.from("products").select("id, is_published, is_sold_out, variants:product_variants(stock)"),
  ]);
  const o = (orders ?? []) as Pick<Order, "id" | "order_number" | "customer_name" | "status" | "total" | "created_at" | "is_seen">[];
  const by = (s: Order["status"]) => o.filter((x) => x.status === s).length;
  const prods = products ?? [];
  const stockOf = (p: (typeof prods)[number]) => (p.variants as { stock: number }[]).reduce((s, v) => s + v.stock, 0);
  const inStock = prods.filter((p) => !p.is_sold_out && stockOf(p) > 0).length;

  return (
    <>
      <PageHeader title="Overzicht" description="Alles over je webshop in één oogopslag."
        action={<Link href="/admin/producten/nieuw" className="a-btn a-btn-dark">+ Product toevoegen</Link>} />

      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-taupe">Bestellingen</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Totaal bestellingen" value={o.length} href="/admin/bestellingen" />
        <StatCard label="Nieuwe bestellingen" value={by("new")} href="/admin/bestellingen?status=new" highlight={by("new") > 0} />
        <StatCard label="Wacht op bevestiging" value={by("awaiting_confirmation")} href="/admin/bestellingen?status=awaiting_confirmation" />
        <StatCard label="Wacht op betaling" value={by("awaiting_payment")} href="/admin/bestellingen?status=awaiting_payment" />
        <StatCard label="Afgerond" value={by("completed")} href="/admin/bestellingen?status=completed" />
      </div>

      <h2 className="mb-3 mt-8 text-xs font-medium uppercase tracking-[0.1em] text-taupe">Producten</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Totaal producten" value={prods.length} href="/admin/producten" />
        <StatCard label="Op voorraad" value={inStock} href="/admin/producten?filter=voorraad" />
        <StatCard label="Uitverkocht" value={prods.length - inStock} href="/admin/producten?filter=uitverkocht" />
        <StatCard label="Verborgen" value={prods.filter((p) => !p.is_published).length} href="/admin/producten?filter=verborgen" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-serif text-2xl">Laatste bestellingen</h2>
        <Link href="/admin/bestellingen" className="text-sm underline">Alle bestellingen</Link>
      </div>
      <div className="mt-4">
        {o.length === 0 ? <Empty>Nog geen bestellingen. Nieuwe bestellingen verschijnen hier automatisch.</Empty> : (
          <ul className="a-card divide-y divide-line">
            {o.slice(0, 8).map((x) => (
              <li key={x.id}>
                <Link href={`/admin/bestellingen/${x.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-cream/50">
                  {!x.is_seen && <span className="size-2 rounded-full bg-champagne" aria-label="Nieuw" />}
                  <span className="font-medium">{x.order_number}</span>
                  <span className="text-sm text-brown">{x.customer_name}</span>
                  <span className="text-xs text-taupe">{formatDateTime(x.created_at)}</span>
                  <span className="ml-auto flex items-center gap-3"><span className="text-sm">{formatPrice(x.total)}</span><StatusBadge status={x.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
