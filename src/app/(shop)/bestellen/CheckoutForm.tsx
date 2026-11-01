"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/components/shop/CartProvider";
import { useCartSync } from "@/components/shop/useCartSync";
import { formatPrice } from "@/lib/format";
import { PRIVATE_ARRANGEMENT_TEXT } from "@/lib/site";
import { validateCheckout, type CheckoutErrors, type CheckoutInput } from "@/lib/validation";
import { placeOrder } from "../actions";

const KEY_STORAGE = "noir-checkout-key";

function getIdempotencyKey() {
  try {
    const existing = sessionStorage.getItem(KEY_STORAGE);
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem(KEY_STORAGE, key);
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutForm() {
  const { items, ready, subtotal, clear } = useCart();
  const { notice, synced } = useCartSync();
  const router = useRouter();
  const [values, setValues] = useState<CheckoutInput>({ name: "", phone: "", snapchat: "", email: "", notes: "" });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [honeypot, setHoneypot] = useState("");

  if (!ready) return <div className="h-96 animate-pulse bg-cream/60" />;
  if (items.length === 0 && !submitting) {
    return (
      <div className="border border-line bg-cream/40 px-6 py-20 text-center">
        <p className="heading-display text-3xl">Je winkelwagen is leeg</p>
        <Link href="/collectie" className="btn btn-dark mt-10">Bekijk de collectie</Link>
      </div>
    );
  }

  const set = (k: keyof CheckoutInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return; // prevents double submissions
    const errs = validateCheckout(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Controleer de gemarkeerde velden.");
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await placeOrder({ ...values, website: honeypot }, items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), getIdempotencyKey());
      if (!res.ok) {
        setFormError(res.message);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      try {
        sessionStorage.setItem("noir-last-order", JSON.stringify({ orderNumber: res.orderNumber, total: res.total, items: res.items, name: values.name.trim() }));
        sessionStorage.removeItem(KEY_STORAGE);
      } catch { /* ignore */ }
      clear();
      router.replace(`/bestelling-geplaatst?nr=${encodeURIComponent(res.orderNumber)}`);
    } catch {
      setFormError("Er ging iets mis met de verbinding. Controleer je internet en probeer het opnieuw — je bestelling wordt niet dubbel geplaatst.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-14 lg:grid-cols-[1fr_400px]">
      <div className="space-y-12">
        <p className="border-l-2 border-champagne bg-cream/60 px-5 py-4 text-sm leading-relaxed text-brown">
          <strong className="font-medium text-espresso">Je betaalt niet online.</strong> {PRIVATE_ARRANGEMENT_TEXT}
        </p>

        <fieldset className="space-y-8">
          <legend className="mb-8 font-serif text-2xl">Jouw gegevens</legend>
          <Field id="name" label="Volledige naam" required error={errors.name}>
            <input id="f-name" autoComplete="name" value={values.name} onChange={set("name")} className="field" aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} required maxLength={100} />
          </Field>
          <Field id="phone" label="Telefoonnummer" required error={errors.phone} hint="Hierop nemen wij contact met je op.">
            <input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" value={values.phone} onChange={set("phone")} className="field" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "e-phone" : "h-phone"} required maxLength={20} />
          </Field>
          <Field id="snapchat" label="Snapchat-gebruikersnaam" error={errors.snapchat} hint="Optioneel — je kunt ook zonder Snapchat bestellen.">
            <input id="f-snapchat" autoComplete="off" autoCapitalize="none" placeholder="gebruikersnaam" value={values.snapchat} onChange={set("snapchat")} className="field" aria-invalid={!!errors.snapchat} aria-describedby={errors.snapchat ? "e-snapchat" : "h-snapchat"} maxLength={31} />
          </Field>
          <Field id="email" label="E-mailadres" error={errors.email}>
            <input id="f-email" type="email" autoComplete="email" placeholder="naam@voorbeeld.nl" value={values.email} onChange={set("email")} className="field" aria-invalid={!!errors.email} aria-describedby={errors.email ? "e-email" : undefined} maxLength={254} />
          </Field>
          <Field id="notes" label="Opmerkingen" error={errors.notes} hint="Bijvoorbeeld je voorkeur voor verzenden of afhalen.">
            <textarea id="f-notes" rows={4} value={values.notes} onChange={set("notes")} className="field resize-none" aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "e-notes" : "h-notes"} maxLength={1000} />
          </Field>
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit bg-cream/70 p-7 lg:sticky lg:top-32">
        <h2 className="font-serif text-2xl">Je bestelling</h2>
        {notice && <p role="status" className="mt-4 border border-champagne/50 bg-champagne/10 px-4 py-3 text-xs leading-relaxed">{notice}</p>}
        <ul className="mt-6 divide-y divide-line">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                {item.brand && <p className="text-[0.58rem] uppercase tracking-[0.24em] text-champagne">{item.brand}</p>}
                <p className="font-serif text-base leading-tight">{item.name}</p>
                <p className="mt-1 text-xs text-taupe">Maat {item.size} · {item.quantity}×</p>
              </div>
              <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between text-taupe"><dt>Levering / afhalen</dt><dd>In overleg</dd></div>
          <div className="flex justify-between text-base"><dt>Totaal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-taupe">Eventuele verzendkosten worden niet automatisch berekend en vooraf persoonlijk met je besproken.</p>

        {formError && <p role="alert" className="mt-5 border border-[#d9a99d] bg-[#fbeeeb] px-4 py-3 text-sm text-[#7d2a1c]">{formError}</p>}

        <button type="submit" disabled={submitting || !synced || items.length === 0} className="btn btn-dark mt-6 w-full">
          {submitting ? "Bestelling wordt geplaatst…" : "Bestelling plaatsen"}
        </button>
        <p className="mt-4 text-center text-[0.68rem] leading-relaxed text-taupe">
          Met het plaatsen ga je akkoord met de <Link href="/algemene-voorwaarden" className="underline">algemene voorwaarden</Link> en het <Link href="/privacy" className="underline">privacybeleid</Link>.
        </p>
      </aside>
    </form>
  );
}

function Field({ id, label, required = false, error, hint, children }: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="field-label">
        <span>{label}</span>
        <span className={required ? "text-espresso" : "text-taupe"}>{required ? "Verplicht" : "Optioneel"}</span>
      </label>
      {children}
      {error ? <p id={`e-${id}`} className="mt-2 text-xs text-[#8b3a2a]">{error}</p>
        : hint ? <p id={`h-${id}`} className="mt-2 text-xs text-taupe">{hint}</p> : null}
    </div>
  );
}
