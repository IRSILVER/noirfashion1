"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { CloseIcon } from "../icons";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

export function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, subtotal, setQuantity, remove, count } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;
  const close = () => setDrawerOpen(false);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Winkelwagen">
      <div className="absolute inset-0 bg-noir/40 backdrop-blur-[2px]" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-ivory">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-2xl">Winkelwagen <span className="text-base text-taupe">({count})</span></h2>
          <button type="button" onClick={close} className="p-2" aria-label="Winkelwagen sluiten"><CloseIcon /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-serif text-2xl">Je winkelwagen is leeg</p>
            <p className="mt-3 text-sm text-brown">Ontdek onze zorgvuldig geselecteerde stukken.</p>
            <Link href="/collectie" onClick={close} className="btn btn-dark mt-8">Bekijk de collectie</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link href={`/product/${item.slug}`} onClick={close} className="relative block h-28 w-22 shrink-0 overflow-hidden bg-cream">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="88px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    {item.brand && <p className="text-[0.6rem] uppercase tracking-[0.25em] text-champagne">{item.brand}</p>}
                    <p className="font-serif text-lg leading-tight">{item.name}</p>
                    <p className="mt-1 text-xs text-taupe">Maat {item.size}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper value={item.quantity} max={item.maxStock} onChange={(q) => setQuantity(item.variantId, q)} small />
                      <span className="text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <button type="button" onClick={() => remove(item.variantId)} className="mt-2 self-start text-[0.65rem] uppercase tracking-[0.2em] text-taupe underline-offset-4 hover:underline">
                      Verwijderen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-6 py-6">
              <div className="flex justify-between text-sm"><span>Subtotaal</span><span>{formatPrice(subtotal)}</span></div>
              <p className="mt-2 text-xs leading-relaxed text-taupe">Je betaalt niet online. Betaling en levering of afhaling spreken we persoonlijk met je af.</p>
              <div className="mt-5 grid gap-3">
                <Link href="/bestellen" onClick={close} className="btn btn-dark w-full">Bestelling plaatsen</Link>
                <Link href="/winkelwagen" onClick={close} className="btn btn-outline w-full">Bekijk winkelwagen</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
