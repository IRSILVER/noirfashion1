import Link from "next/link";
import { Empty, PageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { STATUS_LABELS, STATUS_ORDER, formatDateTime, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata = { title: "Bestellingen beheren" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase.from("orders")
    .select("id, order_number, customer_name, phone, snapchat, email, status, total, created_at, is_seen, items:order_items(quantity)")
    .order("created_at", { ascending: false }).limit(500);
  if (status && STATUS_ORDER.includes(status as OrderStatus)) query = query.eq("status", status);
  const search = q?.trim().replace(/[%,()]/g, "");
  if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,snapchat.ilike.%${search}%,email.ilike.%${search}%`);
  const { data } = await query;
  const orders = (data ?? []) as (Order & { items: { quantity: number }[] })[];

  return (
    <>
      <PageHeader title="Bestellingen beheren" description="Klik op een bestelling om de klantgegevens, producten en status te bekijken." />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Link href="/admin/bestellingen" className={`a-btn ${!status ? "a-btn-dark" : "a-btn-ghost"} min-h-9 px-3 text-xs`}>Alle</Link>
          {STATUS_ORDER.map((s) => (
            <Link key={s} href={`/admin/bestellingen?status=${s}`} className={`a-btn ${status === s ? "a-btn-dark" : "a-btn-ghost"} min-h-9 px-3 text-xs`}>{STATUS_LABELS[s]}</Link>
          ))}
        </div>
        <form className="md:ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Zoek op nummer, naam, telefoon…" className="a-input md:w-72" />
        </form>
      </div>

      {orders.length === 0 ? <Empty>Geen bestellingen gevonden.</Empty> : (
        <>
          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/bestellingen/${o.id}`} className={`a-card block p-4 ${!o.is_seen ? "border-champagne" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{!o.is_seen && <span className="mr-2 inline-block size-2 rounded-full bg-champagne" />}{o.order_number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-2 text-sm">{o.customer_name} · {o.phone}</p>
                  <p className="mt-1 flex justify-between text-xs text-taupe"><span>{formatDateTime(o.created_at)}</span><span className="text-sm text-espresso">{formatPrice(o.total)}</span></p>
                </Link>
              </li>
            ))}
          </ul>
          {/* desktop table */}
          <div className="a-card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-cream/40 text-left text-[0.7rem] uppercase tracking-[0.06em] text-taupe">
                <tr><th className="px-4 py-3">Bestelnummer</th><th className="px-4 py-3">Datum</th><th className="px-4 py-3">Klant</th><th className="px-4 py-3">Telefoon</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Totaal</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-cream/40 ${!o.is_seen ? "bg-[#fffaf1]" : ""}`}>
                    <td className="px-4 py-3 font-medium"><Link href={`/admin/bestellingen/${o.id}`} className="underline-offset-4 hover:underline">{!o.is_seen && <span className="mr-2 inline-block size-2 rounded-full bg-champagne" />}{o.order_number}</Link></td>
                    <td className="whitespace-nowrap px-4 py-3 text-taupe">{formatDateTime(o.created_at)}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{o.phone}</td>
                    <td className="px-4 py-3">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
