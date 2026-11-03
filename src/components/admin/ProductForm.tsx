"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveBrand, saveProduct, type ProductPayload } from "@/app/admin/actions";
import { CONDITION_LABELS } from "@/lib/format";
import { removeUploadedImage, uploadImage } from "@/lib/upload";
import type { Product, ProductCondition } from "@/lib/types";

type Opt = { id: string; name: string; slug?: string };
type ImgRow = { id?: string; url: string; storage_path: string | null; alt: string; isNew?: boolean };
type VarRow = { key: string; id?: string; size: string; stock: string; price: string; sale_price: string };

const QUICK_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One size"];
const toInput = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));
let keySeq = 0;
const newKey = () => `k${++keySeq}`;

export function ProductForm({ product, brands: initialBrands, categories }: { product?: Product; brands: Opt[]; categories: Opt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [brands, setBrands] = useState(initialBrands);
  const [newBrand, setNewBrand] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    brand_id: product?.brand_id ?? "",
    category_id: product?.category_id ?? "",
    condition: (product?.condition ?? "new_with_tags") as ProductCondition,
    price: toInput(product?.price),
    sale_price: toInput(product?.sale_price),
    is_published: product?.is_published ?? true,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? !product,
    is_sold_out: product?.is_sold_out ?? false,
  });
  const [variants, setVariants] = useState<VarRow[]>(
    product?.variants.map((v) => ({ key: newKey(), id: v.id, size: v.size, stock: String(v.stock), price: toInput(v.price), sale_price: toInput(v.sale_price) }))
      ?? [{ key: newKey(), size: "", stock: "1", price: "", sale_price: "" }],
  );
  const [images, setImages] = useState<ImgRow[]>(product?.images.map((i) => ({ id: i.id, url: i.url, storage_path: i.storage_path, alt: i.alt ?? "" })) ?? []);
  const [showSizePrices, setShowSizePrices] = useState(product?.variants.some((v) => v.price != null || v.sale_price != null) ?? false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setDirty(true); };
  const updVar = (key: string, patch: Partial<VarRow>) => { setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v))); setDirty(true); };

  // ---------------------------------------------------------------- photos
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setMessage(null);
    for (const file of Array.from(files).slice(0, 15)) {
      setUploading((n) => n + 1);
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is groter dan 25 MB.`);
        const { url, path } = await uploadImage(file, "products");
        setImages((imgs) => [...imgs, { url, storage_path: path, alt: "", isNew: true }]);
        setDirty(true);
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Uploaden mislukt." });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = async (idx: number) => {
    const img = images[idx];
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
    setDirty(true);
    // A photo that was never saved can be removed from storage right away.
    if (img.isNew && img.storage_path) await removeUploadedImage(img.storage_path);
  };
  const moveImage = (idx: number, dir: -1 | 1) => {
    setImages((imgs) => {
      const next = [...imgs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return imgs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setDirty(true);
  };

  // ----------------------------------------------------------------- brand
  const addBrand = () => {
    if (!newBrand?.trim()) return;
    start(async () => {
      const res = await saveBrand({ name: newBrand });
      if (!res.ok) { setMessage({ ok: false, text: res.error }); return; }
      setBrands((b) => [...b, { id: res.id, name: res.name, slug: res.slug }].sort((a, c) => a.name.localeCompare(c.name, "nl")));
      upd("brand_id", res.id);
      setNewBrand(null);
    });
  };

  // ------------------------------------------------------------------ save
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading > 0) { setMessage({ ok: false, text: "Wacht tot alle foto's zijn geüpload." }); return; }
    const payload: ProductPayload = {
      id: product?.id, ...f, brand_id: f.brand_id || null, category_id: f.category_id || null,
      variants: variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, price: showSizePrices ? v.price : "", sale_price: showSizePrices ? v.sale_price : "" })),
      images: images.map((i) => ({ id: i.id, url: i.url, storage_path: i.storage_path, alt: i.alt })),
    };
    start(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) { setMessage({ ok: false, text: res.error }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      setDirty(false);
      if (!product) { router.push(`/admin/producten/${res.id}?opgeslagen=1`); return; }
      setMessage({ ok: true, text: "Wijzigingen opgeslagen. De webshop is bijgewerkt." });
      router.refresh();
    });
  };

  const sizes = new Set(variants.map((v) => v.size.trim().toLowerCase()));
  const totalStock = variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0);

  return (
    <form onSubmit={onSubmit} className="pb-24">
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mb-6 border px-4 py-3 text-sm ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>{message.text}</p>
      )}
      <SavedNotice />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* BASIS */}
          <Card title="Productinformatie">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="a-label">Productnaam *</label>
                <input id="name" required value={f.name} onChange={(e) => upd("name", e.target.value)} className="a-input" placeholder="Bijv. Essentials Hoodie Dark Oatmeal" maxLength={150} />
              </div>
              <div>
                <label htmlFor="brand" className="a-label">Merk</label>
                {newBrand === null ? (
                  <>
                  <div className="flex gap-2">
                    <select id="brand" value={f.brand_id} onChange={(e) => upd("brand_id", e.target.value)} className="a-input">
                      <option value="">— Kies een merk —</option>
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setNewBrand("")} className="a-btn a-btn-ghost shrink-0" title="Nieuw merk toevoegen">+ Nieuw</button>
                  </div>
                  {(() => {
                    const b = brands.find((x) => x.id === f.brand_id);
                    return b?.slug
                      ? <p className="mt-1 text-xs text-taupe">Verschijnt automatisch op <span className="text-espresso">/merken/{b.slug}</span>{!f.is_published && " (zodra het product online staat)"}</p>
                      : <p className="mt-1 text-xs text-taupe">Kies een merk om het product op de merkpagina te tonen.</p>;
                  })()}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input autoFocus value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className="a-input" placeholder="Naam nieuw merk"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBrand(); } }} />
                    <button type="button" onClick={addBrand} disabled={pending} className="a-btn a-btn-dark shrink-0">Toevoegen</button>
                    <button type="button" onClick={() => setNewBrand(null)} className="a-btn a-btn-ghost shrink-0">×</button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="category" className="a-label">Categorie</label>
                <select id="category" value={f.category_id} onChange={(e) => upd("category_id", e.target.value)} className="a-input">
                  <option value="">— Kies een categorie —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="condition" className="a-label">Staat *</label>
                <select id="condition" value={f.condition} onChange={(e) => upd("condition", e.target.value as ProductCondition)} className="a-input">
                  {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map((c) => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="slug" className="a-label">URL-naam (optioneel)</label>
                <input id="slug" value={f.slug} onChange={(e) => upd("slug", e.target.value)} className="a-input" placeholder="wordt automatisch gemaakt" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="a-label">Beschrijving</label>
                <textarea id="description" rows={6} value={f.description} onChange={(e) => upd("description", e.target.value)} className="a-input"
                  placeholder="Materiaal, pasvorm, kleur, eventuele gebruikssporen, wat er wordt meegeleverd…" />
              </div>
            </div>
          </Card>

          {/* FOTO'S */}
          <Card title="Foto's" hint="De eerste foto is de hoofdfoto. Foto's worden automatisch geoptimaliseerd. Gebruik bij voorkeur staande foto's (verhouding 4:5).">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <div key={img.url} className="group relative">
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                    <Image src={img.url} alt={img.alt || ""} fill sizes="200px" className="object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-noir px-2 py-0.5 text-[0.65rem] text-white">Hoofdfoto</span>}
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="a-btn a-btn-ghost min-h-8 flex-1 px-0 text-xs" aria-label="Naar links">←</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="a-btn a-btn-ghost min-h-8 flex-1 px-0 text-xs" aria-label="Naar rechts">→</button>
                    <button type="button" onClick={() => removeImage(i)} className="a-btn a-btn-danger min-h-8 flex-1 px-0 text-xs" aria-label="Foto verwijderen">✕</button>
                  </div>
                  <input value={img.alt} onChange={(e) => { const alt = e.target.value; setImages((imgs) => imgs.map((x, j) => (j === i ? { ...x, alt } : x))); setDirty(true); }}
                    className="a-input mt-1.5 py-1.5 text-xs" placeholder="Omschrijving (optioneel)" />
                </div>
              ))}
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-white text-center text-sm text-taupe transition-colors hover:border-champagne hover:text-espresso"
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
                <span className="text-2xl">+</span>
                {uploading > 0 ? `Uploaden… (${uploading})` : "Foto's toevoegen"}
                <span className="px-3 text-[0.7rem]">Klik of sleep foto's hierheen</span>
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
              </label>
            </div>
          </Card>

          {/* MATEN & VOORRAAD */}
          <Card title="Maten & voorraad" hint="Voeg elke beschikbare maat toe met de voorraad. Zet de voorraad op 0 als een maat tijdelijk op is.">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {QUICK_SIZES.map((s) => (
                <button key={s} type="button" disabled={sizes.has(s.toLowerCase())}
                  onClick={() => { setVariants((vs) => [...vs.filter((v) => v.size.trim() || v.id), { key: newKey(), size: s, stock: "1", price: "", sale_price: "" }]); setDirty(true); }}
                  className="a-btn a-btn-ghost min-h-8 px-2.5 text-xs">+ {s}</button>
              ))}
            </div>
            <div className="space-y-2">
              <div className={`hidden gap-2 text-[0.68rem] font-medium uppercase tracking-[0.06em] text-taupe sm:grid ${showSizePrices ? "sm:grid-cols-[1fr_90px_110px_110px_40px]" : "sm:grid-cols-[1fr_110px_40px]"}`}>
                <span>Maat</span><span>Voorraad</span>{showSizePrices && <><span>Prijs maat</span><span>Actie maat</span></>}<span />
              </div>
              {variants.map((v) => (
                <div key={v.key} className={`grid grid-cols-[1fr_90px_40px] gap-2 ${showSizePrices ? "sm:grid-cols-[1fr_90px_110px_110px_40px]" : "sm:grid-cols-[1fr_110px_40px]"}`}>
                  <input value={v.size} onChange={(e) => updVar(v.key, { size: e.target.value })} className="a-input" placeholder="Maat (bijv. M, 42)" aria-label="Maat" maxLength={30} />
                  <input value={v.stock} onChange={(e) => updVar(v.key, { stock: e.target.value.replace(/[^\d]/g, "") })} inputMode="numeric" className="a-input" aria-label="Voorraad" />
                  {showSizePrices && (
                    <>
                      <input value={v.price} onChange={(e) => updVar(v.key, { price: e.target.value })} inputMode="decimal" className="a-input col-start-1 sm:col-start-auto" placeholder="€ standaard" aria-label="Prijs voor deze maat" />
                      <input value={v.sale_price} onChange={(e) => updVar(v.key, { sale_price: e.target.value })} inputMode="decimal" className="a-input" placeholder="€ geen" aria-label="Actieprijs voor deze maat" />
                    </>
                  )}
                  <button type="button" onClick={() => { setVariants((vs) => vs.filter((x) => x.key !== v.key)); setDirty(true); }}
                    className="a-btn a-btn-danger px-0" aria-label={`Maat ${v.size} verwijderen`}>✕</button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { setVariants((vs) => [...vs, { key: newKey(), size: "", stock: "1", price: "", sale_price: "" }]); setDirty(true); }} className="a-btn a-btn-ghost">+ Maat toevoegen</button>
              <span className="text-sm text-taupe">Totale voorraad: <strong className="text-espresso">{totalStock}</strong></span>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input type="checkbox" checked={showSizePrices} onChange={(e) => setShowSizePrices(e.target.checked)} className="mt-1 accent-[#141210]" />
              <span>Andere prijs per maat instellen <span className="block text-xs text-taupe">Laat een maatprijs leeg om de standaard verkoopprijs te gebruiken.</span></span>
            </label>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card title="Prijs" hint="Jouw eigen verkoopprijs. Er wordt nooit automatisch een prijs berekend.">
            <label htmlFor="price" className="a-label">Verkoopprijs (€) *</label>
            <input id="price" required inputMode="decimal" value={f.price} onChange={(e) => upd("price", e.target.value)} className="a-input text-lg" placeholder="0,00" />
            <label htmlFor="sale" className="a-label mt-4">Actieprijs (€) — optioneel</label>
            <input id="sale" inputMode="decimal" value={f.sale_price} onChange={(e) => upd("sale_price", e.target.value)} className="a-input" placeholder="Leeg = geen korting" />
            {f.sale_price && <button type="button" onClick={() => upd("sale_price", "")} className="mt-2 text-xs underline">Korting verwijderen</button>}
          </Card>

          <Card title="Zichtbaarheid">
            <div className="space-y-3">
              <Toggle checked={f.is_published} onChange={(v) => upd("is_published", v)} label="Online in de webshop" hint="Uit = verborgen voor klanten" />
              <Toggle checked={f.is_new_arrival} onChange={(v) => upd("is_new_arrival", v)} label="Nieuw binnen" hint="Toon bij ‘Nieuw binnen’" />
              <Toggle checked={f.is_featured} onChange={(v) => upd("is_featured", v)} label="Uitgelicht" hint="Toon op de homepage" />
              <Toggle checked={f.is_sold_out} onChange={(v) => upd("is_sold_out", v)} label="Uitverkocht" hint="Niet meer bestelbaar, blijft zichtbaar" />
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-[250px]">
        <div className="flex items-center justify-end gap-3">
          {dirty && <span className="mr-auto text-xs text-taupe">Niet-opgeslagen wijzigingen</span>}
          <button type="button" onClick={() => router.push("/admin/producten")} className="a-btn a-btn-ghost">Annuleren</button>
          <button type="submit" disabled={pending || uploading > 0} className="a-btn a-btn-dark min-w-40">
            {pending ? "Opslaan…" : product ? "Wijzigingen opslaan" : "Product opslaan"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SavedNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("opgeslagen") === "1") {
      setShow(true);
      url.searchParams.delete("opgeslagen");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);
  return show ? <p role="status" className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Product opgeslagen.</p> : null;
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="a-card p-5">
      <h2 className="font-serif text-xl">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-relaxed text-taupe">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="text-sm">{label}{hint && <span className="block text-xs text-taupe">{hint}</span>}</span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-noir peer-focus-visible:ring-2 peer-focus-visible:ring-champagne" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
