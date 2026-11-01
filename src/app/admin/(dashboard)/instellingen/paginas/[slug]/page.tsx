import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/PageEditor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { PAGES } from "@/lib/pages";

export const metadata = { title: "Pagina bewerken" };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PAGES[slug]) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("content_pages").select("*").eq("slug", slug).maybeSingle();
  return (
    <>
      <Link href="/admin/instellingen" className="text-sm text-taupe hover:text-espresso">← Instellingen</Link>
      <div className="mt-3"><PageHeader title={PAGES[slug].title} description={`Te zien op /${slug}`}
        action={<Link href={`/${slug}`} target="_blank" className="a-btn a-btn-ghost">Bekijk pagina ↗</Link>} /></div>
      <PageEditor slug={slug} title={data?.title ?? PAGES[slug].title} body={data?.body ?? ""} />
    </>
  );
}
