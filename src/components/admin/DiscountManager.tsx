"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDiscountCode, saveDiscountCode } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import type { DiscountCode } from "@/lib/types";
import { Empty } from "./ui";

interface Draft { id?: string; code: string; kind: "percent" | "fixed"; value: string; max_uses: string }
const EMPTY: Draft = { code: "", kind: "percent", value: "", max_uses: "" };

const describe = (c: Pick<DiscountCode, "kind" | "value">) =>
  c.kind === "percent" ? `${String(c.value).replace(".", ",").replace(/,00$/, "")}% korting` : `${formatPrice(c.value)} korting`;

export function DiscountManager({ codes }: { codes: DiscountCode[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = (d: Draft, after: () => void) => start(async () => {
    const res = await saveDiscountCode({ id: d.id, code: d.code, kind: d.kind, value: d.value, max_uses: d.max_uses.trim() === "" ? null : d.max_uses });
    setMsg(res.ok ? { ok: true, text: d.id ? "Kortingscode opgeslagen." : "Kortingscode aangemaakt." } : { ok: false, text: res.error });
    if (res.ok) after();
    router.refresh();
  });

  const remove = (c: DiscountCode) => {
    if (!confirm(`Kortingscode “${c.code}” verwijderen?\n\nBestaande bestellingen behouden hun korting en de codenaam.`)) return;
    start(async () => {
      const res = await deleteDiscountCode(c.id);
      setMsg(res.ok ? { ok: true, text: "Kortingscode verwijderd." } : { ok: false, text: res.error });
      router.refresh();
    });
  };

  const fields = (d: Draft, set: (d: Draft) => void) => (
    <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <div>
        <label className="a-label">Naam van de code</label>
        <input value={d.code} onChange={(e) => set({ ...d, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
          placeholder="NOIR10" maxLength={30} autoCapitalize="characters" spellCheck={false} className="a-input uppercase" required />
      </div>
      <div>
        <label className="a-label">Soort korting</label>
        <select value={d.kind} onChange={(e) => set({ ...d, kind: e.target.value as Draft["kind"] })} className="a-input">
          <option value="percent">Percentage (%)</option>
          <option value="fixed">Vast bedrag (€)</option>
        </select>
      </div>
      <div>
        <label className="a-label">{d.kind === "percent" ? "Percentage" : "Bedrag in euro"}</label>
        <input value={d.value} onChange={(e) => set({ ...d, value: e.target.value })} inputMode="decimal"
          placeholder={d.kind === "percent" ? "10" : "15"} className="a-input" required />
      </div>
      <div>
        <label className="a-label">Max. aantal keer</label>
        <input value={d.max_uses} onChange={(e) => set({ ...d, max_uses: e.target.value.replace(/[^\d]/g, "") })} inputMode="numeric"
          placeholder="Leeg = onbeperkt" className="a-input" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <form className="a-card space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); save(draft, () => setDraft(EMPTY)); }}>
        <h2 className="font-serif text-xl">Nieuwe kortingscode</h2>
        {fields(draft, setDraft)}
        <button type="submit" disabled={pending || !draft.code.trim() || !draft.value.trim()} className="a-btn a-btn-dark">+ Kortingscode aanmaken</button>
      </form>

      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</p>}

      {codes.length === 0 ? (
        <Empty>Je hebt nog geen kortingscodes. Maak hierboven je eerste code aan, bijvoorbeeld NOIR10.</Empty>
      ) : (
        <ul className="a-card divide-y divide-line">
          {codes.map((c) => {
            const expired = c.max_uses !== null && c.used_count >= c.max_uses;
            const editing = editingId === c.id;
            return editing ? (
              <li key={c.id} className="space-y-3 bg-cream/30 p-4">
                {fields(draft, setDraft)}
                <p className="text-xs text-taupe">Deze code is al {c.used_count}× gebruikt. Het aantal gebruiken kun je niet aanpassen, alleen het maximum.</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} onClick={() => save(draft, () => setEditingId(null))} className="a-btn a-btn-dark">Opslaan</button>
                  <button type="button" onClick={() => setEditingId(null)} className="a-btn a-btn-ghost">Annuleren</button>
                </div>
              </li>
            ) : (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    <span className="tracking-wider">{c.code}</span>
                    <span className={`ml-3 rounded-full px-2 py-0.5 text-[0.68rem] ${expired ? "bg-stone-200 text-stone-700" : "bg-emerald-100 text-emerald-800"}`}>
                      {expired ? "Verlopen" : "Actief"}
                    </span>
                  </p>
                  <p className="text-xs text-taupe">
                    {describe(c)} · {c.used_count}× gebruikt{c.max_uses !== null ? ` van ${c.max_uses}` : " (onbeperkt)"}
                    {c.max_uses !== null && !expired && ` · nog ${c.max_uses - c.used_count} over`}
                  </p>
                </div>
                <button type="button" disabled={pending} className="a-btn a-btn-ghost min-h-9 px-3 text-xs"
                  onClick={() => { setEditingId(c.id); setDraft({ id: c.id, code: c.code, kind: c.kind, value: String(c.value).replace(/\.00$/, ""), max_uses: c.max_uses === null ? "" : String(c.max_uses) }); setMsg(null); }}>
                  Bewerken
                </button>
                <button type="button" disabled={pending} onClick={() => remove(c)} className="a-btn a-btn-danger min-h-9 px-3 text-xs">Verwijderen</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
