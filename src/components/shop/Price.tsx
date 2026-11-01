import { formatPrice } from "@/lib/format";

export function Price({ price, compareAt, from = false, className = "" }: {
  price: number; compareAt?: number | null; from?: boolean; className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {from && <span className="text-[0.7em] uppercase tracking-[0.15em] text-taupe">Vanaf</span>}
      <span className={compareAt ? "text-[#8b3a2a]" : ""}>{formatPrice(price)}</span>
      {compareAt ? (
        <span className="text-[0.85em] text-taupe line-through" aria-label={`Oorspronkelijke prijs ${formatPrice(compareAt)}`}>
          {formatPrice(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
