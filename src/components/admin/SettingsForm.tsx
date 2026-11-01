"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/types";

const FIELDS: { key: keyof SiteSettings; label: string; hint?: string; placeholder?: string; area?: boolean; group: string }[] = [
  { group: "Contact", key: "whatsapp", label: "WhatsApp-nummer", placeholder: "06 12345678" },
  { group: "Contact", key: "instagram", label: "Instagram-gebruikersnaam", placeholder: "noirfashion" },
  { group: "Contact", key: "snapchat", label: "Snapchat-gebruikersnaam", placeholder: "noirfashion" },
  { group: "Contact", key: "contact_email", label: "E-mailadres", placeholder: "info@…" },
  { group: "Contact", key: "contact_intro", label: "Tekst op de contactpagina (optioneel)", area: true },
  { group: "Homepage", key: "hero_title", label: "Grote titel", hint: "Een punt + spatie start een nieuwe regel." },
  { group: "Homepage", key: "hero_subtitle", label: "Introductietekst", area: true },
  { group: "Homepage", key: "announcement", label: "Aankondigingsbalk (optioneel)", hint: "Kort bericht bovenaan elke pagina. Leeg = verborgen.", placeholder: "Bijv. Nieuwe drop vrijdag 20:00" },
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(FIELDS.map((f) => [f.key, (settings[f.key] as string) ?? ""])));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form className="a-card space-y-8 p-5" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const res = await saveSettings(v);
        setMsg(res.ok ? { ok: true, text: "Instellingen opgeslagen." } : { ok: false, text: res.error });
        router.refresh();
      });
    }}>
      {["Contact", "Homepage"].map((group) => (
        <fieldset key={group}>
          <legend className="mb-1 font-serif text-xl">{group}</legend>
          {group === "Contact" && <p className="mb-4 text-xs text-taupe">Lege velden worden op de website getoond als “Volgt binnenkort”.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.filter((f) => f.group === group).map((f) => (
              <div key={f.key} className={f.area ? "md:col-span-2" : ""}>
                <label htmlFor={f.key} className="a-label">{f.label}</label>
                {f.area
                  ? <textarea id={f.key} rows={3} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="a-input" placeholder={f.placeholder} />
                  : <input id={f.key} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="a-input" placeholder={f.placeholder} />}
                {f.hint && <p className="mt-1 text-xs text-taupe">{f.hint}</p>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="a-btn a-btn-dark">{pending ? "Opslaan…" : "Instellingen opslaan"}</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
