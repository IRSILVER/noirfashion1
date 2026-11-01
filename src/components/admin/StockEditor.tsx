"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateStock } from "@/app/admin/actions";

interface Row { id: string; productId: string; product: string; brand: string | null; size: string; stock: number; published: boolean; soldOut: boolean }

export function StockEditor({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);

  const changed = Object.entries(values).filter(([id, v]) => v !== "" && Number(v) !== rows.find((r) => r.id === id)?.stock);
  const shown = useMemo(() => rows.filter((r) =>
    (!q || `${r.product} ${r.brand ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!onlyLow || r.stock <= 1)), [rows, q, onlyLow]);

  const save = () => start(async () => {
    const res = await updateStock(changed.map(([id, v]) => ({ id, stock: parseInt(v, 10) })));
    setMsg(res.ok ? { ok: true, text: `${changed.length} ${changed.length === 1 ? "maat" : "maten"} bijgewerkt.` } : { ok: false, text: res.error });
    if (res.ok) setValues({});
    router.refresh();
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek product of merk…" className="a-input sm:w-72" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="accent-[#141210]" /> Alleen lage voorraad (0–1)</label>
        <div className="flex items-center gap-3 sm:ml-auto">
          {msg && <span className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</span>}
          <button type="button" onClick={save} disabled={pending || changed.length === 0} className="a-btn a-btn-dark">
            {pending ? "Opslaan…" : `Opslaan${changed.length ? ` (${changed.length})` : ""}`}
          </button>
        </div>
      </div>
      <div className="a-card divide-y divide-line">
        {shown.map((r) => {
          const val = values[r.id] ?? String(r.stock);
          const isChanged = values[r.id] !== undefined && Number(values[r.id]) !== r.stock;
          return (
            <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${isChanged ? "bg-[#fffaf1]" : ""}`}>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/producten/${r.productId}`} className="block truncate text-sm font-medium hover:underline">{r.product}</Link>
                <p className="text-xs text-taupe">{r.brand ?? "Geen merk"}{!r.published && " · verborgen"}{r.soldOut && " · gemarkeerd als uitverkocht"}</p>
              </div>
              <span className="w-20 text-sm">Maat <strong>{r.size}</strong></span>
              <div className="flex items-center">
                <button type="button" className="a-btn a-btn-ghost min-h-9 w-9 px-0" aria-label="Min 1"
                  onClick={() => setValues((v) => ({ ...v, [r.id]: String(Math.max(0, (parseInt(val) || 0) - 1)) }))}>−</button>
                <input value={val} inputMode="numeric" aria-label={`Voorraad ${r.product} maat ${r.size}`}
                  onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value.replace(/[^\d]/g, "") }))}
                  className={`a-input mx-1 w-16 text-center ${Number(val) === 0 ? "text-red-800" : ""}`} />
                <button type="button" className="a-btn a-btn-ghost min-h-9 w-9 px-0" aria-label="Plus 1"
                  onClick={() => setValues((v) => ({ ...v, [r.id]: String((parseInt(val) || 0) + 1) }))}>+</button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <p className="p-6 text-center text-sm text-taupe">Niets gevonden.</p>}
      </div>
    </>
  );
}
