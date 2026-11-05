import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderControls } from "@/components/admin/OrderControls";
import { StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { CONDITION_LABELS, formatDateTime, formatPrice, whatsappNumber } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export const metadata = { title: "Bestelling" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order & { items: OrderItem[] };

  return (
    <>
      <Link href="/admin/bestellingen" className="text-sm text-taupe hover:text-espresso">← Alle bestellingen</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-4">
        <h1 className="font-serif text-3xl md:text-4xl">{order.order_number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-taupe">{formatDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="a-card p-5">
            <h2 className="mb-4 font-serif text-xl">Klantgegevens</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="a-label">Naam</dt><dd>{order.customer_name}</dd></div>
              <div>
                <dt className="a-label">Telefoon</dt>
                <dd className="flex flex-wrap items-center gap-3">
                  {order.phone ? (
                    <>
                      <a href={`tel:${order.phone}`} className="underline">{order.phone}</a>
                      <a href={`https://wa.me/${whatsappNumber(order.phone)}`} target="_blank" rel="noopener noreferrer" className="a-btn a-btn-ghost min-h-8 px-2.5 text-xs">WhatsApp</a>
                    </>
                  ) : <span className="text-taupe">Niet opgegeven — de klant koos Snapchat</span>}
                </dd>
              </div>
              <div><dt className="a-label">Snapchat</dt><dd>{order.snapchat ? <a href={`https://snapchat.com/add/${order.snapchat}`} target="_blank" rel="noopener noreferrer" className="underline">{order.snapchat}</a> : <span className="text-taupe">Niet opgegeven</span>}</dd></div>
              <div><dt className="a-label">E-mail</dt><dd>{order.email ? <a href={`mailto:${order.email}`} className="underline">{order.email}</a> : <span className="text-taupe">Niet opgegeven</span>}</dd></div>
              {order.customer_notes && <div className="sm:col-span-2"><dt className="a-label">Opmerking van de klant</dt><dd className="whitespace-pre-line rounded-sm bg-cream/60 p-3">{order.customer_notes}</dd></div>}
            </dl>
          </section>

          <section className="a-card">
            <h2 className="px-5 pt-5 font-serif text-xl">Bestelde producten</h2>
            <p className="px-5 pt-1 text-xs text-taupe">Prijzen zoals ze golden op het moment van bestellen.</p>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4 px-5 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                    {it.image_url && <Image src={it.image_url} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    {it.brand_name && <p className="text-[0.7rem] uppercase tracking-[0.12em] text-champagne">{it.brand_name}</p>}
                    <p className="font-medium">
                      {it.product_id ? <Link href={`/admin/producten/${it.product_id}`} className="hover:underline">{it.product_name}</Link> : it.product_name}
                      {!it.product_id && <span className="ml-2 text-xs font-normal text-taupe">(product verwijderd)</span>}
                    </p>
                    <p className="mt-1 text-taupe">Maat {it.size} · {it.quantity} × {formatPrice(it.unit_price)}{it.condition && ` · ${CONDITION_LABELS[it.condition]}`}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(it.line_total)}</p>
                </li>
              ))}
            </ul>
            {Number(order.discount_amount) > 0 && (
              <div className="space-y-1 border-t border-line px-5 py-4 text-sm">
                <div className="flex justify-between"><span>Subtotaal</span><span>{formatPrice(Number(order.total) + Number(order.discount_amount))}</span></div>
                <div className="flex justify-between text-champagne"><span>Kortingscode {order.discount_code}</span><span>−{formatPrice(Number(order.discount_amount))}</span></div>
              </div>
            )}
            <div className="flex justify-between border-t border-line px-5 py-4">
              <span>Totaal (excl. eventuele verzendkosten)</span><strong>{formatPrice(order.total)}</strong>
            </div>
          </section>
        </div>

        <OrderControls id={order.id} status={order.status} notes={order.internal_notes ?? ""} seen={order.is_seen} />
      </div>
    </>
  );
}
