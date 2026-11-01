import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText, inline } from "@/components/shop/RichText";
import { getContentPage } from "@/lib/catalog";
import { PAGES } from "@/lib/pages";

export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(PAGES).map((page) => ({ page })); }

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const meta = PAGES[page];
  return meta ? { title: meta.title, description: meta.description, alternates: { canonical: `/${page}` } } : {};
}

export default async function InfoPage({ params }: Props) {
  const { page } = await params;
  const meta = PAGES[page];
  if (!meta) notFound();
  const content = await getContentPage(page);
  const body = content?.body?.trim() || "[IN TE VULLEN: deze pagina wordt binnenkort aangevuld.]";
  const isFaq = page === "veelgestelde-vragen";

  return (
    <div className="container-luxe py-14 md:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="eyebrow">NOIR FASHION</p>
        <h1 className="heading-display mt-4 text-5xl md:text-6xl">{content?.title || meta.title}</h1>
        <div className="mt-14">{isFaq ? <Faq text={body} /> : <RichText text={body} />}</div>
      </article>
    </div>
  );
}

function Faq({ text }: { text: string }) {
  const items = text.split(/^### /m).map((s) => s.trim()).filter(Boolean).map((chunk) => {
    const [q, ...rest] = chunk.split("\n");
    return { q: q.trim(), a: rest.join("\n").trim() };
  });
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <details key={i} className="group py-6" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-xl md:text-2xl">
            <span>{inline(it.q)}</span>
            <span className="mt-1 text-champagne transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          {it.a && <div className="mt-4"><RichText text={it.a} /></div>}
        </details>
      ))}
    </div>
  );
}
