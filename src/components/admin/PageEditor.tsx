"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { savePage } from "@/app/admin/actions";
import { RichText } from "@/components/shop/RichText";

export function PageEditor({ slug, title, body }: { slug: string; title: string; body: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [t, setT] = useState(title);
  const [b, setB] = useState(body);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="a-card space-y-4 p-5">
        <div><label className="a-label" htmlFor="t">Titel</label><input id="t" value={t} onChange={(e) => setT(e.target.value)} className="a-input" /></div>
        <div>
          <label className="a-label" htmlFor="b">Tekst</label>
          <textarea id="b" rows={24} value={b} onChange={(e) => setB(e.target.value)} className="a-input font-mono text-[0.82rem] leading-relaxed" />
          <p className="mt-2 text-xs leading-relaxed text-taupe">
            Opmaak: <code>## Kop</code> · <code>### Vraag</code> (bij FAQ) · <code>- opsomming</code> · <code>**vet**</code> · lege regel = nieuwe alinea.
            Vervang alle teksten tussen <mark className="placeholder-tag">[IN TE VULLEN …]</mark> door je eigen informatie.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={pending} className="a-btn a-btn-dark" onClick={() => start(async () => {
            const res = await savePage(slug, t, b);
            setMsg(res.ok ? { ok: true, text: "Pagina opgeslagen." } : { ok: false, text: res.error });
            router.refresh();
          })}>{pending ? "Opslaan…" : "Pagina opslaan"}</button>
          {msg && <span className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</span>}
        </div>
      </div>
      <div className="a-card bg-ivory p-6">
        <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-taupe">Voorbeeld</p>
        <h2 className="heading-display mb-8 text-4xl">{t}</h2>
        <RichText text={b || " "} />
      </div>
    </div>
  );
}
