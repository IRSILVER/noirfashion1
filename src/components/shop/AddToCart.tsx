"use client";
import { useMemo, useState } from "react";
import { resolvePrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { CheckIcon } from "../icons";
import { useCart } from "./CartProvider";
import { Price } from "./Price";
import { QuantityStepper } from "./QuantityStepper";

export function AddToCart({ product }: { product: Product }) {
  const { add, items, setDrawerOpen } = useCart();
  const firstInStock = product.variants.find((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.length === 1 && firstInStock ? firstInStock.id : null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const inCart = items.find((i) => i.variantId === variantId)?.quantity ?? 0;
  const maxAddable = variant ? Math.max(0, variant.stock - inCart) : 0;
  const soldOut = product.is_sold_out || !firstInStock;
  const shown = useMemo(() => resolvePrice(product, variant ?? firstInStock ?? null), [product, variant, firstInStock]);

  const onAdd = () => {
    if (!variant) { setError("Kies eerst een maat."); return; }
    if (maxAddable <= 0) { setError("Je hebt de volledige voorraad van deze maat al in je winkelwagen."); return; }
    const p = resolvePrice(product, variant);
    add({
      variantId: variant.id, productId: product.id, slug: product.slug, name: product.name,
      brand: product.brand?.name ?? null, size: variant.size, price: p.price, compareAt: p.compareAt,
      image: product.images[0]?.url ?? null, quantity: Math.min(qty, maxAddable), maxStock: variant.stock,
    });
    setError(null); setAdded(true); setQty(1);
    setTimeout(() => setAdded(false), 2200);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-8">
      <Price price={shown.price} compareAt={shown.compareAt} className="text-2xl" />

      <fieldset>
        <legend className="field-label mb-4 w-full">
          <span>Maat{variant && <span className="ml-2 normal-case tracking-normal text-taupe">— {variant.size}</span>}</span>
        </legend>
        {product.variants.length === 0 ? (
          <p className="text-sm text-taupe">Er zijn nog geen maten beschikbaar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stock <= 0 || product.is_sold_out;
              const selected = v.id === variantId;
              return (
                <button key={v.id} type="button" disabled={out} aria-pressed={selected}
                  onClick={() => { setVariantId(v.id); setError(null); setQty(1); }}
                  className={`min-w-14 border px-4 py-3 text-sm transition-all ${selected ? "border-noir bg-noir text-ivory" : "border-line hover:border-espresso"} ${out ? "cursor-not-allowed text-taupe/50 line-through" : ""}`}>
                  {v.size}
                </button>
              );
            })}
          </div>
        )}
        {variant && variant.stock > 0 && variant.stock <= 2 && !product.is_sold_out && (
          <p className="mt-3 text-xs text-champagne">Nog {variant.stock} beschikbaar</p>
        )}
      </fieldset>

      {!soldOut ? (
        <div className="flex gap-3">
          <QuantityStepper value={qty} max={Math.max(1, maxAddable)} onChange={setQty} />
          <button type="button" onClick={onAdd} className="btn btn-dark flex-1" disabled={!!variant && maxAddable <= 0}>
            {added ? (<><CheckIcon className="size-4" /> Toegevoegd</>) : "Toevoegen aan winkelwagen"}
          </button>
        </div>
      ) : (
        <button type="button" disabled className="btn btn-outline w-full">Uitverkocht</button>
      )}
      {error && <p role="alert" className="text-sm text-[#8b3a2a]">{error}</p>}
    </div>
  );
}
