import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/catalog";

export const metadata = { title: "Product bewerken" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: brands }, { data: categories }] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle(),
    supabase.from("brands").select("id, name, slug").order("sort_order").order("name"),
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
  ]);
  if (!data) notFound();
  const product = normalizeProduct(data);
  return (
    <>
      <Link href="/admin/producten" className="text-sm text-taupe hover:text-espresso">← Alle producten</Link>
      <div className="mt-3">
        <PageHeader title="Product bewerken" description={product.name}
          action={product.is_published ? <Link href={`/product/${product.slug}`} target="_blank" className="a-btn a-btn-ghost">Bekijk in webshop ↗</Link> : undefined} />
      </div>
      <ProductForm product={product} brands={brands ?? []} categories={categories ?? []} />
    </>
  );
}
