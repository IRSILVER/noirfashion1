"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteBrand, reorderBrands, saveBrand } from "@/app/admin/actions";
import { removeUploadedImage, uploadImage } from "@/lib/upload";

export interface AdminBrand {
  id: string; name: string; slug: string; description: string | null; is_active: boolean; sort_order: number;
  header_image_url: string | null; header_storage_path: string | null; count: number;
}

type Draft = Omit<AdminBrand, "id" | "count" | "sort_order"> & { id?: string };
const EMPTY: Draft = { name: "", slug: "", description: "", is_active: true, header_image_url: null, header_storage_path: null };

export function BrandManager({ brands }: { brands: AdminBrand[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [order, setOrder] = useState(brands);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setOrder(brands), [brands]);

  const orderChanged = order.some((b, i) => b.id !== brands[i]?.id);
  const move = (i: number, dir: -1 | 1) => setOrder((list) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const saveOrder = () => start(async () => {
    const res = await reorderBrands(order.map((b) => b.id));
    setMsg(res.ok ? { ok: true, text: "Volgorde opgeslagen. De webshop is bijgewerkt." } : { ok: false, text: res.error });
    router.refresh();
  });

  const remove = (b: AdminBrand) => {
    const warn = b.count > 0
      ? `\n\nLet op: ${b.count} ${b.count === 1 ? "product is" : "producten zijn"} aan dit merk gekoppeld. Die blijven in de webshop staan, maar zonder merk. Kies eventueel eerst een ander merk bij die producten.`
      : "";
    if (!confirm(`Merk “${b.name}” verwijderen? De merkpagina verdwijnt.${warn}\n\nBestaande bestellingen blijven onveranderd bewaard.`)) return;
    start(async () => {
      const res = await deleteBrand(b.id);
      setMsg(res.ok ? { ok: true, text: `“${b.name}” is verwijderd.` } : { ok: false, text: res.error });
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { setEditing({ ...EMPTY }); setMsg(null); }} className="a-btn a-btn-dark">+ Merk toevoegen</button>
        {orderChanged && (
          <>
            <button type="button" disabled={pending} onClick={saveOrder} className="a-btn a-btn-dark">Volgorde opslaan</button>
            <button type="button" onClick={() => setOrder(brands)} className="a-btn a-btn-ghost">Volgorde herstellen</button>
          </>
        )}
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</p>}
      </div>

      {editing && !editing.id && (
        <BrandEditor draft={editing} onCancel={() => setEditing(null)}
          onSaved={(name) => { setEditing(null); setMsg({ ok: true, text: `“${name}” is toegevoegd. De merkpagina staat online en het merk is te kiezen bij producten.` }); router.refresh(); }} />
      )}

      <ul className="a-card divide-y divide-line">
        {order.map((b, i) => editing?.id === b.id ? (
          <li key={b.id} className="p-0">
            <BrandEditor draft={editing} onCancel={() => setEditing(null)}
              onSaved={(name) => { setEditing(null); setMsg({ ok: true, text: `“${name}” is opgeslagen.` }); router.refresh(); }} />
          </li>
        ) : (
          <li key={b.id} className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 text-taupe hover:text-espresso disabled:opacity-25" aria-label={`${b.name} omhoog`}>▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="px-2 text-taupe hover:text-espresso disabled:opacity-25" aria-label={`${b.name} omlaag`}>▼</button>
            </div>
            <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-sand">
              {b.header_image_url
                ? <Image src={b.header_image_url} alt="" fill sizes="80px" className="object-cover" />
                : <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] text-taupe">Geen foto</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {b.name}
                {!b.is_active && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[0.68rem] font-normal text-stone-600">Verborgen</span>}
              </p>
              <p className="truncate text-xs text-taupe">/merken/{b.slug} · {b.count} {b.count === 1 ? "product" : "producten"}</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              {b.is_active && <Link href={`/merken/${b.slug}`} target="_blank" className="a-btn a-btn-ghost min-h-9 flex-1 px-3 text-xs sm:flex-none">Bekijk ↗</Link>}
              <button type="button" onClick={() => { setEditing({ ...b }); setMsg(null); }} className="a-btn a-btn-ghost min-h-9 flex-1 px-3 text-xs sm:flex-none">Bewerken</button>
              <button type="button" disabled={pending} onClick={() => remove(b)} className="a-btn a-btn-danger min-h-9 flex-1 px-3 text-xs sm:flex-none">Verwijderen</button>
            </div>
          </li>
        ))}
        {order.length === 0 && <li className="p-8 text-center text-sm text-taupe">Nog geen merken. Klik op “+ Merk toevoegen”.</li>}
      </ul>
      <p className="text-xs text-taupe">Gebruik ▲ ▼ om de volgorde te bepalen waarin merken op de website verschijnen, en klik daarna op “Volgorde opslaan”.</p>
    </div>
  );
}

function BrandEditor({ draft, onCancel, onSaved }: { draft: Draft; onCancel: () => void; onSaved: (name: string) => void }) {
  const [pending, start] = useTransition();
  const [d, setD] = useState<Draft>(draft);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedThisSession = useRef<string | null>(null);
  const isNew = !draft.id;
  const slugChanged = !isNew && d.slug !== draft.slug;

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const { url, path } = await uploadImage(file, "brands", 2400);
      if (uploadedThisSession.current) await removeUploadedImage(uploadedThisSession.current);
      uploadedThisSession.current = path;
      setD((x) => ({ ...x, header_image_url: url, header_storage_path: path }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uploaden mislukt.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const cancel = async () => {
    if (uploadedThisSession.current) await removeUploadedImage(uploadedThisSession.current); // never saved
    onCancel();
  };

  const save = () => start(async () => {
    setError(null);
    const res = await saveBrand({ ...d, description: d.description ?? "" });
    if (!res.ok) { setError(res.error); return; }
    uploadedThisSession.current = null;
    onSaved(res.name);
  });

  return (
    <div className={`space-y-4 p-5 ${isNew ? "a-card border-champagne" : "bg-cream/30"}`}>
      <p className="font-serif text-xl">{isNew ? "Nieuw merk" : `${draft.name} bewerken`}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="b-name" className="a-label">Merknaam *</label>
          <input id="b-name" autoFocus value={d.name} maxLength={80} onChange={(e) => setD({ ...d, name: e.target.value })} className="a-input" placeholder="Bijv. Prada" />
        </div>
        <div>
          <label htmlFor="b-slug" className="a-label">Webadres</label>
          <div className="flex items-center">
            <span className="border border-r-0 border-line bg-cream/60 px-2.5 py-[0.6rem] text-sm text-taupe">/merken/</span>
            <input id="b-slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} className="a-input" placeholder={isNew ? "wordt automatisch gemaakt" : ""} />
          </div>
          {slugChanged && <p className="mt-1 text-xs text-amber-800">Let op: oude links naar /merken/{draft.slug} werken daarna niet meer.</p>}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="b-desc" className="a-label">Korte introductie (optioneel)</label>
          <textarea id="b-desc" rows={2} maxLength={400} value={d.description ?? ""} onChange={(e) => setD({ ...d, description: e.target.value })} className="a-input"
            placeholder="Eén of twee zinnen bovenaan de merkpagina. Schrijf in je eigen woorden." />
        </div>
        <div className="md:col-span-2">
          <p className="a-label">Merkfoto / headerafbeelding (optioneel)</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative aspect-[16/6] w-full overflow-hidden bg-sand sm:w-72">
              {d.header_image_url
                ? <Image src={d.header_image_url} alt="" fill sizes="288px" className="object-cover" />
                : <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-taupe">Zonder foto krijgt de pagina een stijlvolle beige header</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="a-btn a-btn-ghost cursor-pointer">
                {uploading ? "Uploaden…" : d.header_image_url ? "Andere foto kiezen" : "Foto uploaden"}
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
              </label>
              {d.header_image_url && <button type="button" onClick={() => setD({ ...d, header_image_url: null, header_storage_path: null })} className="a-btn a-btn-danger">Foto verwijderen</button>}
            </div>
          </div>
          <p className="mt-2 text-xs text-taupe">Gebruik een brede, liggende foto (bijv. 2400 × 900 px) die je zelf hebt gemaakt of mag gebruiken. Gebruik geen officiële merklogo&apos;s of campagnebeelden van het merk.</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} className="accent-[#141210]" />
        Zichtbaar in de webshop (uit = merkpagina tijdelijk offline)
      </label>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending || uploading || !d.name.trim()} onClick={save} className="a-btn a-btn-dark">{pending ? "Opslaan…" : isNew ? "Merk toevoegen" : "Opslaan"}</button>
        <button type="button" onClick={cancel} className="a-btn a-btn-ghost">Annuleren</button>
      </div>
    </div>
  );
}
