import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Merken" };

export default async function BrandsAdmin() {
  const { supabase } = await requireAdmin();
  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from("brands").select("*").order("sort_order").order("name"),
    supabase.from("products").select("brand_id"),
  ]);
  const counts: Record<string, number> = {};
  (products ?? []).forEach((p) => { if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] ?? 0) + 1; });
  return (
    <>
      <PageHeader title="Merken" description="Voeg merken toe, wijzig ze of zet ze uit. Elk merk krijgt automatisch een eigen pagina in de webshop." />
      <TaxonomyManager kind="brand" items={(brands ?? []).map((b) => ({ ...b, count: counts[b.id] ?? 0 }))} />
    </>
  );
}
