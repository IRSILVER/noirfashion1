import { BrandManager, type AdminBrand } from "@/components/admin/BrandManager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Merken beheren" };

export default async function BrandsAdmin() {
  const { supabase } = await requireAdmin();
  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from("brands").select("*").order("sort_order").order("name"),
    supabase.from("products").select("brand_id"),
  ]);
  const counts: Record<string, number> = {};
  (products ?? []).forEach((p: { brand_id: string | null }) => { if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] ?? 0) + 1; });
  const list: AdminBrand[] = (brands ?? []).map((b: Omit<AdminBrand, "count">) => ({
    ...b, header_image_url: b.header_image_url ?? null, header_storage_path: b.header_storage_path ?? null, count: counts[b.id] ?? 0,
  }));
  return (
    <>
      <PageHeader title="Merken beheren"
        description="Elk merk krijgt automatisch een eigen pagina in de webshop. Producten verschijnen daar vanzelf zodra je bij het product dit merk kiest." />
      <BrandManager brands={list} />
    </>
  );
}
