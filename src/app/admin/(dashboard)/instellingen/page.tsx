import Link from "next/link";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { emailNotificationsConfigured } from "@/lib/notify";
import { PAGES } from "@/lib/pages";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Instellingen" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: settings }, { data: pages }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("content_pages").select("slug, body, updated_at"),
  ]);
  const emailOn = emailNotificationsConfigured();

  return (
    <>
      <PageHeader title="Instellingen" description="Contactgegevens, teksten op de homepage en alle informatiepagina's." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SettingsForm settings={(settings ?? {}) as SiteSettings} />
        <div className="space-y-6">
          <section className="a-card p-5">
            <h2 className="font-serif text-xl">Pagina&apos;s</h2>
            <p className="mt-1 text-xs text-taupe">Pagina&apos;s met een geel gemarkeerde [IN TE VULLEN]-tekst moet je nog aanvullen.</p>
            <ul className="mt-4 divide-y divide-line">
              {Object.entries(PAGES).map(([slug, meta]) => {
                const page = pages?.find((p) => p.slug === slug);
                const todo = !page || page.body.includes("[IN TE VULLEN");
                return (
                  <li key={slug} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/instellingen/paginas/${slug}`} className="text-sm hover:underline">{meta.title}</Link>
                    {todo ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] text-amber-900">Aanvullen</span>
                      : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.68rem] text-emerald-800">Klaar</span>}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="a-card p-5">
            <h2 className="font-serif text-xl">Bestelmeldingen</h2>
            <p className="mt-2 text-sm">Dashboard-meldingen: <strong className="text-emerald-800">aan</strong></p>
            <p className="mt-1 text-xs text-taupe">Nieuwe bestellingen tonen een teller en een melding zolang het dashboard open is.</p>
            <p className="mt-4 text-sm">E-mailmeldingen: {emailOn ? <strong className="text-emerald-800">ingesteld</strong> : <strong className="text-amber-800">niet ingesteld</strong>}</p>
            <p className="mt-1 text-xs leading-relaxed text-taupe">
              {emailOn
                ? "Bij elke bestelling wordt een e-mail verstuurd via Resend naar het adres in ORDER_NOTIFICATION_EMAIL. Plaats een testbestelling om te controleren of hij aankomt."
                : "Stel RESEND_API_KEY en ORDER_NOTIFICATION_EMAIL in bij Vercel (zie README) om ook een e-mail te krijgen bij elke bestelling."}
            </p>
          </section>

          <section className="a-card border-amber-300 bg-amber-50/60 p-5">
            <h2 className="font-serif text-xl">Juridisch</h2>
            <p className="mt-2 text-xs leading-relaxed text-amber-950">
              De teksten voor privacy, voorwaarden en retourneren zijn een opzet en geen juridisch advies. Laat ze controleren voordat je live gaat.
              Wettelijke consumentenrechten (zoals het herroepingsrecht bij aankopen op afstand) kunnen ook voor jou gelden.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
