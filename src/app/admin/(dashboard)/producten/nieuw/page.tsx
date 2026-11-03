import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Product toevoegen" };

export default async function NewProduct() {
  const { supabase } = await requireAdmin();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").order("sort_order").order("name"),
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
  ]);
  return (
    <>
      <PageHeader title="Product toevoegen" description="Jij bepaalt alles: naam, foto's, maten, voorraad, staat en je eigen verkoopprijs." />
      <ProductForm brands={brands ?? []} categories={categories ?? []} />
    </>
  );
}
