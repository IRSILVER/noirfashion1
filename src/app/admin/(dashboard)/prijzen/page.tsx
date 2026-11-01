import { PriceEditor } from "@/components/admin/PriceEditor";
import { Empty, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/catalog";

export const metadata = { title: "Prijzen" };

export default async function PricesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  const products = (data ?? []).map(normalizeProduct).map((p) => ({
    id: p.id, name: p.name, brand: p.brand?.name ?? null, price: p.price, sale_price: p.sale_price,
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, price: v.price, sale_price: v.sale_price })),
  }));
  return (
    <>
      <PageHeader title="Prijzen" description="Jij bepaalt alle prijzen. Pas verkoopprijzen en actieprijzen aan en klik op Opslaan. Bestaande bestellingen behouden hun oorspronkelijke prijs." />
      {products.length === 0 ? <Empty>Er zijn nog geen producten.</Empty> : <PriceEditor products={products} />}
    </>
  );
}
