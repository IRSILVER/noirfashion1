import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Categorieën" };

export default async function CategoriesAdmin() {
  const { supabase } = await requireAdmin();
  const [{ data: cats }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("products").select("category_id"),
  ]);
  const counts: Record<string, number> = {};
  (products ?? []).forEach((p) => { if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1; });
  return (
    <>
      <PageHeader title="Categorieën" description="Categorieën worden gebruikt in de filters en op de homepage." />
      <TaxonomyManager kind="category" items={(cats ?? []).map((c) => ({ ...c, count: counts[c.id] ?? 0 }))} />
    </>
  );
}
