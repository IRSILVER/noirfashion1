"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ShopQuery } from "@/lib/catalog";
import { CloseIcon, FilterIcon } from "../icons";

interface Opt { value: string; label: string; count?: number }

export function ShopFilters({ basePath, query, brands, categories, sizes, total, hideBrand = false, children }: {
  basePath: string; query: ShopQuery; brands: Opt[]; categories: Opt[]; sizes: string[];
  total: number; hideBrand?: boolean; children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(query.min ?? "");
  const [max, setMax] = useState(query.max ?? "");

  const push = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...query, ...next };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    start(() => router.push(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: false }));
  };
  const toggle = (key: keyof ShopQuery, value: string) => {
    const list = (query[key] ?? "").split(",").filter(Boolean);
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    push({ [key]: next.join(",") || undefined });
  };
  const isOn = (key: keyof ShopQuery, value: string) => (query[key] ?? "").split(",").includes(value);
  const activeCount = ["merk", "categorie", "maat", "min", "max", "beschikbaar", "q", "nieuw"]
    .filter((k) => query[k as keyof typeof query]).length;

  const panel = (
    <div className="space-y-10">
      {query.q && (
        <div className="flex items-center justify-between border border-line px-4 py-3 text-sm">
          <span>Zoekterm: <strong className="font-medium">“{query.q}”</strong></span>
          <button type="button" onClick={() => push({ q: undefined })} aria-label="Zoekterm wissen"><CloseIcon className="size-4" /></button>
        </div>
      )}
      <Group title="Beschikbaarheid">
        <Check label="Alleen op voorraad" checked={query.beschikbaar === "1"} onChange={() => push({ beschikbaar: query.beschikbaar === "1" ? undefined : "1" })} />
        <Check label="Nieuw binnen" checked={query.nieuw === "1"} onChange={() => push({ nieuw: query.nieuw === "1" ? undefined : "1" })} />
      </Group>
      {!hideBrand && brands.length > 0 && (
        <Group title="Merk">
          {brands.map((b) => <Check key={b.value} label={b.label} count={b.count} checked={isOn("merk", b.value)} onChange={() => toggle("merk", b.value)} />)}
        </Group>
      )}
      {categories.length > 0 && (
        <Group title="Categorie">
          {categories.map((c) => <Check key={c.value} label={c.label} count={c.count} checked={isOn("categorie", c.value)} onChange={() => toggle("categorie", c.value)} />)}
        </Group>
      )}
      {sizes.length > 0 && (
        <Group title="Maat">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} type="button" aria-pressed={isOn("maat", s)} onClick={() => toggle("maat", s)}
                className={`min-w-11 border px-3 py-2 text-xs transition-colors ${isOn("maat", s) ? "border-noir bg-noir text-ivory" : "border-line hover:border-espresso"}`}>{s}</button>
            ))}
          </div>
        </Group>
      )}
      <Group title="Prijs (€)">
        <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); push({ min: min || undefined, max: max || undefined }); }}>
          <label className="flex-1 text-xs text-taupe">Van
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))} className="field py-2" placeholder="0" />
          </label>
          <label className="flex-1 text-xs text-taupe">Tot
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))} className="field py-2" placeholder="∞" />
          </label>
          <button type="submit" className="border border-espresso px-3 py-2 text-[0.65rem] uppercase tracking-[0.2em] hover:bg-espresso hover:text-ivory">OK</button>
        </form>
      </Group>
      {activeCount > 0 && (
        <button type="button" onClick={() => { setMin(""); setMax(""); start(() => router.push(basePath, { scroll: false })); }}
          className="text-[0.65rem] uppercase tracking-[0.24em] text-taupe underline underline-offset-4">Alle filters wissen</button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4 border-y border-line py-4">
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.24em] lg:hidden">
          <FilterIcon /> Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        <p className={`text-xs text-taupe transition-opacity ${pending ? "opacity-40" : ""}`}>{total} {total === 1 ? "item" : "items"}</p>
        <label className="flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.2em]">
          <span className="hidden sm:inline">Sorteren</span>
          <select value={query.sorteer ?? "nieuwste"} onChange={(e) => push({ sorteer: e.target.value === "nieuwste" ? undefined : e.target.value })}
            className="cursor-pointer border-0 bg-transparent py-1 pr-1 text-[0.72rem] uppercase tracking-[0.15em] outline-none">
            <option value="nieuwste">Nieuwste</option>
            <option value="prijs-oplopend">Prijs: laag – hoog</option>
            <option value="prijs-aflopend">Prijs: hoog – laag</option>
          </select>
        </label>
      </div>

      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-14">
        <aside className="hidden lg:block" aria-label="Filters">{panel}</aside>
        <div className={`transition-opacity duration-300 ${pending ? "opacity-50" : ""}`}>{children}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-noir/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[90%] max-w-sm animate-slide-in flex-col bg-ivory">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="eyebrow">Filters</span>
              <button type="button" onClick={() => setOpen(false)} className="p-2" aria-label="Filters sluiten"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-8">{panel}</div>
            <div className="border-t border-line p-5">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-dark w-full">Toon {total} items</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 text-[0.65rem] uppercase tracking-[0.26em] text-espresso">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Check({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-brown hover:text-espresso">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5 accent-[#141210]" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-taupe">{count}</span>}
    </label>
  );
}
