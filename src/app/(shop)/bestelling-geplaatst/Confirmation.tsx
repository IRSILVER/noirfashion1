"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

interface LastOrder { orderNumber: string; total: number; name: string; items: { product_name: string; brand_name: string | null; size: string; quantity: number; line_total: number }[] }

export function Confirmation() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [nr, setNr] = useState<string | null>(null);

  useEffect(() => {
    setNr(new URLSearchParams(window.location.search).get("nr"));
    try {
      const raw = sessionStorage.getItem("noir-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const number = order?.orderNumber ?? nr;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Image src="/brand/monogram-transparent.png" alt="" width={84} height={69} className="mx-auto" />
      <p className="eyebrow mt-10">Bestelbevestiging</p>
      <h1 className="heading-display mt-5 text-4xl md:text-5xl">Bedankt voor je bestelling!</h1>
      <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-brown">
        Je bestelling is succesvol geplaatst. Wij nemen persoonlijk contact met je op om je bestelling te bevestigen en de betaling af te spreken.
      </p>
      {number && (
        <p className="mt-8 inline-block border border-line px-6 py-3 text-sm">
          Bestelnummer <strong className="ml-2 font-medium tracking-wider">{number}</strong>
        </p>
      )}

      <div className="mt-10 border-l-2 border-champagne bg-cream/70 px-6 py-5 text-left text-sm leading-relaxed text-brown">
        <p className="font-medium text-espresso">Let op: je bestelling is nog niet betaald en nog niet definitief bevestigd.</p>
        <p className="mt-2">
          Na het plaatsen van je bestelling nemen wij persoonlijk contact met je op om de betaling (via Tikkie of contant) en de levering of afhaling te bespreken.
          Eventuele verzendkosten spreken we vooraf met je af.
        </p>
      </div>

      {order && order.items.length > 0 && (
        <div className="mt-12 text-left">
          <h2 className="font-serif text-2xl">Overzicht</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((l, i) => (
              <li key={i} className="flex justify-between gap-4 py-4 text-sm">
                <span>{l.brand_name && <span className="text-champagne">{l.brand_name} · </span>}{l.product_name} <span className="text-taupe">— maat {l.size} · {l.quantity}×</span></span>
                <span>{formatPrice(l.line_total)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-base"><span>Totaal (excl. eventuele verzendkosten)</span><strong className="font-medium">{formatPrice(order.total)}</strong></p>
        </div>
      )}

      <div className="mt-14 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/collectie" className="btn btn-dark">Verder winkelen</Link>
        <Link href="/contact" className="btn btn-outline">Contact</Link>
      </div>
    </div>
  );
}
