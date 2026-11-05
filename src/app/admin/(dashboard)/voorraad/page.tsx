import { StockEditor } from "@/components/admin/StockEditor";
import { Empty, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_SELECT, normalizeProduct } from "@/lib/catalog";
import { variantLabel } from "@/lib/pricing";

export const metadata = { title: "Voorraad" };

export default async function StockPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  const products = (data ?? []).map(normalizeProduct);
  const rows = products.flatMap((p) => p.variants.map((v) => ({
    id: v.id, productId: p.id, product: p.name, brand: p.brand?.name ?? null, size: variantLabel(v), stock: v.stock, published: p.is_published, soldOut: p.is_sold_out,
  })));
  return (
    <>
      <PageHeader title="Voorraad" description="Pas de voorraad per maat aan en klik op Opslaan. Bij een bestelling wordt de voorraad automatisch gereserveerd; bij annuleren komt deze terug." />
      {rows.length === 0 ? <Empty>Er zijn nog geen producten met maten.</Empty> : <StockEditor rows={rows} />}
    </>
  );
}
