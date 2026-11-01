"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePrices } from "@/app/admin/actions";

interface V { id: string; size: string; price: number | null; sale_price: number | null }
interface P { id: string; name: string; brand: string | null; price: number; sale_price: number | null; variants: V[] }
const s = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

export function PriceEditor({ products }: { products: P[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pv, setPv] = useState<Record<string, { price: string; sale_price: string }>>({});
  const [vv, setVv] = useState<Record<string, { price: string; sale_price: string }>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");

  const changes = Object.keys(pv).length + Object.keys(vv).length;
  const getP = (p: P) => pv[p.id] ?? { price: s(p.price), sale_price: s(p.sale_price) };
  const getV = (v: V) => vv[v.id] ?? { price: s(v.price), sale_price: s(v.sale_price) };

  const save = () => start(async () => {
    const res = await updatePrices({
      products: Object.entries(pv).map(([id, x]) => ({ id, ...x })),
      variants: Object.entries(vv).map(([id, x]) => {
        const p = products.find((pp) => pp.variants.some((v) => v.id === id))!;
        return { id, ...x, productPrice: getP(p).price };
      }),
    });
    setMsg(res.ok ? { ok: true, text: "Prijzen opgeslagen. De webshop is bijgewerkt." } : { ok: false, text: res.error });
    if (res.ok) { setPv({}); setVv({}); }
    router.refresh();
  });

  const shown = products.filter((p) => !q || `${p.name} ${p.brand ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek product of merk…" className="a-input sm:w-72" />
        <div className="flex items-center gap-3 sm:ml-auto">
          {msg && <span className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</span>}
          <button type="button" onClick={save} disabled={pending || changes === 0} className="a-btn a-btn-dark">{pending ? "Opslaan…" : `Opslaan${changes ? ` (${changes})` : ""}`}</button>
        </div>
      </div>
      <div className="a-card divide-y divide-line">
        <div className="hidden grid-cols-[1fr_130px_130px_110px] gap-3 bg-cream/40 px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.06em] text-taupe md:grid">
          <span>Product</span><span>Verkoopprijs €</span><span>Actieprijs €</span><span />
        </div>
        {shown.map((p) => {
          const val = getP(p);
          return (
            <div key={p.id} className={pv[p.id] ? "bg-[#fffaf1]" : ""}>
              <div className="grid grid-cols-2 gap-3 px-4 py-3 md:grid-cols-[1fr_130px_130px_110px] md:items-center">
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <Link href={`/admin/producten/${p.id}`} className="block truncate text-sm font-medium hover:underline">{p.name}</Link>
                  <p className="text-xs text-taupe">{p.brand ?? "Geen merk"}</p>
                </div>
                <label className="text-xs text-taupe md:text-[0px]">Verkoopprijs
                  <input value={val.price} inputMode="decimal" aria-label={`Verkoopprijs ${p.name}`}
                    onChange={(e) => setPv((x) => ({ ...x, [p.id]: { ...val, price: e.target.value } }))} className="a-input text-sm" />
                </label>
                <label className="text-xs text-taupe md:text-[0px]">Actieprijs
                  <input value={val.sale_price} inputMode="decimal" placeholder="geen" aria-label={`Actieprijs ${p.name}`}
                    onChange={(e) => setPv((x) => ({ ...x, [p.id]: { ...val, sale_price: e.target.value } }))} className="a-input text-sm" />
                </label>
                {p.variants.length > 0 && (
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} className="col-span-2 text-left text-xs underline md:col-span-1">
                    {open[p.id] ? "Verberg maten" : "Prijs per maat"}
                  </button>
                )}
              </div>
              {open[p.id] && (
                <div className="space-y-2 bg-cream/30 px-4 pb-4 pt-1">
                  <p className="text-xs text-taupe">Laat leeg om de standaard verkoopprijs ({val.price || "—"}) te gebruiken.</p>
                  {p.variants.map((v) => {
                    const vval = getV(v);
                    return (
                      <div key={v.id} className={`grid grid-cols-[70px_1fr_1fr] items-center gap-3 md:grid-cols-[1fr_130px_130px_110px] ${vv[v.id] ? "bg-[#fffaf1]" : ""}`}>
                        <span className="text-sm md:pl-6">Maat {v.size}</span>
                        <input value={vval.price} inputMode="decimal" placeholder="standaard" aria-label={`Prijs maat ${v.size}`}
                          onChange={(e) => setVv((x) => ({ ...x, [v.id]: { ...vval, price: e.target.value } }))} className="a-input text-sm" />
                        <input value={vval.sale_price} inputMode="decimal" placeholder="geen" aria-label={`Actieprijs maat ${v.size}`}
                          onChange={(e) => setVv((x) => ({ ...x, [v.id]: { ...vval, sale_price: e.target.value } }))} className="a-input text-sm" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
