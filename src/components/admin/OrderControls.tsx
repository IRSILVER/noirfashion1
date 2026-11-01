"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { markOrderSeen, saveInternalNotes, setOrderStatus } from "@/app/admin/actions";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function OrderControls({ id, status, notes, seen }: { id: string; status: OrderStatus; notes: string; seen: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState(notes);

  useEffect(() => { if (!seen) markOrderSeen(id).then(() => router.refresh()); }, [id, seen, router]);

  const change = (s: OrderStatus) => {
    if (s === "cancelled" && !confirm("Weet je zeker dat je deze bestelling wilt annuleren? De gereserveerde voorraad komt weer beschikbaar.")) return;
    start(async () => {
      const res = await setOrderStatus(id, s);
      setMsg(res.ok ? { ok: true, text: `Status gewijzigd naar “${STATUS_LABELS[s]}”.` } : { ok: false, text: res.error });
      router.refresh();
    });
  };

  return (
    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      <section className="a-card p-5">
        <h2 className="mb-4 font-serif text-xl">Status</h2>
        <label htmlFor="status" className="a-label">Status wijzigen</label>
        <select id="status" value={status} disabled={pending} onChange={(e) => change(e.target.value as OrderStatus)} className="a-input">
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={pending || status === "paid"} onClick={() => change("paid")} className="a-btn a-btn-ghost">Markeer als betaald</button>
          <button type="button" disabled={pending || status === "completed"} onClick={() => change("completed")} className="a-btn a-btn-ghost">Afronden</button>
          <button type="button" disabled={pending || status === "awaiting_payment"} onClick={() => change("awaiting_payment")} className="a-btn a-btn-ghost">Wacht op betaling</button>
          <button type="button" disabled={pending || status === "cancelled"} onClick={() => change("cancelled")} className="a-btn a-btn-danger">Annuleren</button>
        </div>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</p>}
        <p className="mt-4 text-xs leading-relaxed text-taupe">
          De voorraad is gereserveerd zodra de klant bestelt. Bij annuleren komt deze automatisch terug.
          Betaling (Tikkie of contant) regel je zelf met de klant.
        </p>
      </section>

      <section className="a-card p-5">
        <h2 className="mb-1 font-serif text-xl">Interne notities</h2>
        <p className="mb-3 text-xs text-taupe">Alleen zichtbaar voor beheerders.</p>
        <textarea rows={6} value={note} onChange={(e) => setNote(e.target.value)} className="a-input" placeholder="Bijv. Tikkie verstuurd op 3 nov, afhalen zaterdag…" />
        <button type="button" disabled={pending || note === notes} className="a-btn a-btn-dark mt-3 w-full"
          onClick={() => start(async () => {
            const res = await saveInternalNotes(id, note);
            setMsg(res.ok ? { ok: true, text: "Notities opgeslagen." } : { ok: false, text: res.error });
            router.refresh();
          })}>Notities opslaan</button>
      </section>
    </aside>
  );
}
