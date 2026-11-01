import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/catalog";
import { whatsappNumber } from "@/lib/format";
import { PRIVATE_ARRANGEMENT_TEXT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Neem contact op met NOIR FASHION via WhatsApp, Instagram, Snapchat of e-mail.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    { label: "WhatsApp", value: s.whatsapp, href: s.whatsapp ? `https://wa.me/${whatsappNumber(s.whatsapp)}` : null },
    { label: "Instagram", value: s.instagram && `@${s.instagram.replace(/^@/, "")}`, href: s.instagram ? `https://instagram.com/${s.instagram.replace(/^@/, "")}` : null },
    { label: "Snapchat", value: s.snapchat && s.snapchat.replace(/^@/, ""), href: s.snapchat ? `https://snapchat.com/add/${s.snapchat.replace(/^@/, "")}` : null },
    { label: "E-mail", value: s.contact_email, href: s.contact_email ? `mailto:${s.contact_email}` : null },
  ];

  return (
    <div className="container-luxe py-14 md:py-20">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <header>
          <p className="eyebrow">Wij helpen je graag</p>
          <h1 className="heading-display mt-4 text-5xl md:text-6xl">Contact</h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-brown">
            {s.contact_intro || "Heb je een vraag over een item, je maat of je bestelling? Stuur ons een bericht via een van de kanalen hiernaast."}
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-brown">{PRIVATE_ARRANGEMENT_TEXT}</p>
          <p className="mt-8 text-sm"><Link href="/veelgestelde-vragen" className="link-underline">Bekijk de veelgestelde vragen →</Link></p>
        </header>
        <ul className="grid gap-px self-start bg-line sm:grid-cols-2">
          {channels.map((c) => (
            <li key={c.label} className="bg-ivory p-8">
              <p className="eyebrow">{c.label}</p>
              {c.value && c.href ? (
                <a href={c.href} target={c.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer"
                  className="mt-4 block break-all font-serif text-2xl transition-colors hover:text-champagne">{c.value}</a>
              ) : (
                <p className="mt-4 font-serif text-2xl text-taupe/70">Volgt binnenkort</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
