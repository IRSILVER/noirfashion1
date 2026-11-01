"use client";
import Image from "next/image";
import Link from "next/link";
import { useCartSync } from "@/components/shop/useCartSync";
import { useCart } from "@/components/shop/CartProvider";
import { Price } from "@/components/shop/Price";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { formatPrice } from "@/lib/format";
import { PRIVATE_ARRANGEMENT_TEXT } from "@/lib/site";

export function CartView() {
  const { items, ready, setQuantity, remove, subtotal } = useCart();
  const { notice } = useCartSync();

  if (!ready) return <div className="h-64 animate-pulse bg-cream/60" />;
  if (items.length === 0) {
    return (
      <div className="border border-line bg-cream/40 px-6 py-20 text-center">
        <p className="heading-display text-3xl">Je winkelwagen is leeg</p>
        <p className="mt-4 text-sm text-brown">Ontdek onze zorgvuldig geselecteerde stukken.</p>
        <Link href="/collectie" className="btn btn-dark mt-10">Verder winkelen</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_380px]">
      <div>
        {notice && <p role="status" className="mb-6 border border-champagne/50 bg-champagne/10 px-5 py-4 text-sm">{notice}</p>}
        <div className="hidden grid-cols-[1fr_140px_120px] border-b border-line pb-3 text-[0.62rem] uppercase tracking-[0.24em] text-taupe md:grid">
          <span>Product</span><span>Aantal</span><span className="text-right">Totaal</span>
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.variantId} className="grid grid-cols-[96px_1fr] gap-5 py-7 md:grid-cols-[1fr_140px_120px] md:items-center md:gap-0">
              <div className="contents md:flex md:gap-6">
                <Link href={`/product/${item.slug}`} className="relative block aspect-[4/5] w-24 shrink-0 overflow-hidden bg-cream">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
                </Link>
                <div>
                  {item.brand && <p className="text-[0.6rem] uppercase tracking-[0.26em] text-champagne">{item.brand}</p>}
                  <Link href={`/product/${item.slug}`} className="font-serif text-xl hover:text-brown">{item.name}</Link>
                  <p className="mt-1 text-xs text-taupe">Maat {item.size}</p>
                  <Price price={item.price} compareAt={item.compareAt} className="mt-2 text-sm" />
                  <div className="mt-4 flex items-center gap-5 md:hidden">
                    <QuantityStepper value={item.quantity} max={item.maxStock} onChange={(q) => setQuantity(item.variantId, q)} small />
                    <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <button type="button" onClick={() => remove(item.variantId)} className="mt-3 text-[0.62rem] uppercase tracking-[0.22em] text-taupe underline-offset-4 hover:underline">Verwijderen</button>
                </div>
              </div>
              <div className="hidden md:block"><QuantityStepper value={item.quantity} max={item.maxStock} onChange={(q) => setQuantity(item.variantId, q)} small /></div>
              <p className="hidden text-right md:block">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <Link href="/collectie" className="link-underline mt-8 inline-block text-[0.68rem] uppercase tracking-[0.24em]">← Verder winkelen</Link>
      </div>

      <aside className="h-fit bg-cream/70 p-7 lg:sticky lg:top-32">
        <h2 className="font-serif text-2xl">Overzicht</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between"><dt>Subtotaal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between text-taupe"><dt>Levering / afhalen</dt><dd>In overleg</dd></div>
          <div className="flex justify-between border-t border-line pt-4 text-base"><dt>Totaal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-brown">{PRIVATE_ARRANGEMENT_TEXT} Eventuele verzendkosten bespreken we vooraf met je.</p>
        <Link href="/bestellen" className="btn btn-dark mt-7 w-full">Bestelling plaatsen</Link>
      </aside>
    </div>
  );
}
