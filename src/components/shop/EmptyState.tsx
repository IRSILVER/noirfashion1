import Image from "next/image";
import Link from "next/link";

export function EmptyState({ title, text, href, cta }: { title: string; text?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center border border-line bg-cream/40 px-6 py-20 text-center">
      <Image src="/brand/monogram-transparent.png" alt="" width={72} height={59} className="opacity-40" />
      <h2 className="heading-display mt-8 text-3xl">{title}</h2>
      {text && <p className="mt-4 max-w-md text-sm leading-relaxed text-brown">{text}</p>}
      {href && cta && <Link href={href} className="btn btn-outline mt-10">{cta}</Link>}
    </div>
  );
}
