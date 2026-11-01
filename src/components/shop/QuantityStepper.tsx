"use client";
import { MinusIcon, PlusIcon } from "../icons";

export function QuantityStepper({ value, max, onChange, small = false }: {
  value: number; max: number; onChange: (v: number) => void; small?: boolean;
}) {
  const h = small ? "h-9" : "h-12";
  return (
    <div className={`inline-flex ${h} items-center border border-line`} role="group" aria-label="Aantal">
      <button type="button" className="flex h-full w-9 items-center justify-center disabled:opacity-30" aria-label="Eén minder"
        disabled={value <= 1} onClick={() => onChange(value - 1)}><MinusIcon className="size-3.5" /></button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className="flex h-full w-9 items-center justify-center disabled:opacity-30" aria-label="Eén meer"
        disabled={value >= max} onClick={() => onChange(value + 1)}><PlusIcon className="size-3.5" /></button>
    </div>
  );
}
