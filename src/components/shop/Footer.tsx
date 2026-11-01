import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { whatsappNumber } from "@/lib/format";

const COLS = [
  { title: "Shop", links: [["/collectie", "Collectie"], ["/collectie?nieuw=1", "Nieuw binnen"], ["/merken", "Merken"], ["/maattabel", "Maattabel"]] },
  { title: "Service", links: [["/contact", "Contact"], ["/veelgestelde-vragen", "Veelgestelde vragen"], ["/verzending", "Verzending & afhalen"], ["/retourneren", "Retourneren"], ["/authenticiteit", "Authenticiteit"]] },
  { title: "Informatie", links: [["/over-ons", "Over NOIR FASHION"], ["/privacy", "Privacybeleid"], ["/algemene-voorwaarden", "Algemene voorwaarden"]] },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = [
    settings.instagram && { label: "Instagram", href: `https://instagram.com/${settings.instagram.replace(/^@/, "")}` },
    settings.snapchat && { label: "Snapchat", href: `https://snapchat.com/add/${settings.snapchat.replace(/^@/, "")}` },
    settings.whatsapp && { label: "WhatsApp", href: `https://wa.me/${whatsappNumber(settings.whatsapp)}` },
    settings.contact_email && { label: "E-mail", href: `mailto:${settings.contact_email}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="mt-32 bg-sand text-espresso">
      <div className="container-luxe grid gap-14 py-20 md:grid-cols-[1.2fr_2fr]">
        <div className="flex flex-col items-start">
          <Link href="/" aria-label="NOIR FASHION — naar de homepage">
            <Image src="/brand/noir-fashion-logo.png" alt="NOIR FASHION" width={190} height={190} className="h-auto w-[190px]" />
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-brown">
            Een zorgvuldig samengestelde selectie luxe mode, designerkleding en premium streetwear.
          </p>
          {socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {socials.map((s) => (
                <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline text-[0.65rem] uppercase tracking-[0.24em]">{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="link-underline text-sm text-brown hover:text-espresso">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-espresso/10">
        <div className="container-luxe flex flex-col gap-3 py-6 text-[0.7rem] leading-relaxed text-taupe md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} NOIR FASHION · CURATED LUXURY. TIMELESS STYLE.</p>
          <p className="max-w-xl md:text-right">
            NOIR FASHION is geen officiële verkoper of partner van de getoonde merken. Merknamen zijn eigendom van hun respectieve eigenaren.
          </p>
        </div>
      </div>
    </footer>
  );
}
