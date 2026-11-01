"use client";
import { useEffect, useRef, useState } from "react";
import { getCartQuote } from "@/app/(shop)/actions";
import { useCart } from "./CartProvider";

/**
 * Refreshes the cart with the latest prices and stock from the database once
 * per page view, and tells the customer what changed.
 */
export function useCartSync() {
  const { items, ready, replaceAll } = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    if (items.length === 0) { setSynced(true); return; }
    getCartQuote(items.map((i) => i.variantId)).then((quote) => {
      const changes: string[] = [];
      const next = items.flatMap((item) => {
        const q = quote.find((x) => x.variantId === item.variantId);
        if (!q || !q.available) { changes.push(`${item.name} (${item.size}) is niet meer beschikbaar en is verwijderd.`); return []; }
        const quantity = Math.min(item.quantity, q.stock);
        if (quantity < item.quantity) changes.push(`Van ${item.name} (${item.size}) zijn er nog maar ${q.stock} beschikbaar.`);
        if (q.price !== item.price) changes.push(`De prijs van ${item.name} is bijgewerkt.`);
        return [{ ...item, price: q.price, compareAt: q.compareAt, maxStock: q.stock, quantity, image: q.image, name: q.name, brand: q.brand, slug: q.slug }];
      });
      if (changes.length) { replaceAll(next); setNotice(changes.join(" ")); }
      setSynced(true);
    }).catch(() => setSynced(true));
  }, [ready, items, replaceAll]);

  return { notice, synced };
}
