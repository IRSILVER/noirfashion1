"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBrand, deleteCategory, saveBrand, saveCategory } from "@/app/admin/actions";

interface Item { id: string; name: string; slug: string; sort_order: number; description?: string | null; is_active?: boolean; count: number }

export function TaxonomyManager({ kind, items }: { kind: "brand" | "category"; items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Item>>({});
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isBrand = kind === "brand";
  const noun = isBrand ? "merk" : "categorie";

  const save = (item: Partial<Item>) => start(async () => {
    const res = isBrand
      ? await saveBrand({ id: item.id, name: item.name ?? "", slug: item.slug, description: item.description ?? "", is_active: item.is_active, sort_order: item.sort_order })
      : await saveCategory({ id: item.id, name: item.name ?? "", slug: item.slug, sort_order: item.sort_order });
    setMsg(res.ok ? { ok: true, text: "Opgeslagen." } : { ok: false, text: res.error });
    if (res.ok) { setEditing(null); setNewName(""); }
    router.refresh();
  });

  const remove = (item: Item) => {
    const warn = item.count > 0 ? `\n\nLet op: ${item.count} product(en) zijn gekoppeld. Die blijven bestaan, maar hebben daarna geen ${noun} meer.` : "";
    if (!confirm(`“${item.name}” verwijderen?${warn}`)) return;
    start(async () => {
      const res = isBrand ? await deleteBrand(item.id) : await deleteCategory(item.id);
      setMsg(res.ok ? { ok: true, text: "Verwijderd." } : { ok: false, text: res.error });
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <form className="a-card flex flex-col gap-3 p-4 sm:flex-row" onSubmit={(e) => { e.preventDefault(); save({ name: newName, is_active: true, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 }); }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`Naam nieuw ${noun}`} className="a-input" required />
        <button type="submit" disabled={pending || !newName.trim()} className="a-btn a-btn-dark shrink-0">+ {isBrand ? "Merk" : "Categorie"} toevoegen</button>
      </form>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-800"}`}>{msg.text}</p>}

      <ul className="a-card divide-y divide-line">
        {items.map((item) => editing === item.id ? (
          <li key={item.id} className="space-y-3 bg-cream/30 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_100px]">
              <div><label className="a-label">Naam</label><input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="a-input" /></div>
              <div><label className="a-label">URL-naam</label><input value={draft.slug ?? ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="a-input" /></div>
              <div><label className="a-label">Volgorde</label><input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="a-input" /></div>
            </div>
            {isBrand && (
              <>
                <div><label className="a-label">Korte omschrijving (optioneel, op de merkpagina)</label>
                  <textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="a-input" /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="accent-[#141210]" /> Zichtbaar in de webshop</label>
              </>
            )}
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={() => save(draft)} className="a-btn a-btn-dark">Opslaan</button>
              <button type="button" onClick={() => setEditing(null)} className="a-btn a-btn-ghost">Annuleren</button>
            </div>
          </li>
        ) : (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.name} {isBrand && item.is_active === false && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-[0.68rem] text-stone-600">Verborgen</span>}</p>
              <p className="text-xs text-taupe">/{isBrand ? "merken" : "zoeken?categorie="}{isBrand ? "/" : ""}{item.slug} · {item.count} {item.count === 1 ? "product" : "producten"}</p>
            </div>
            <button type="button" onClick={() => { setEditing(item.id); setDraft(item); setMsg(null); }} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">Bewerken</button>
            <button type="button" disabled={pending} onClick={() => remove(item)} className="a-btn a-btn-danger min-h-9 px-3 text-xs">Verwijderen</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
