import { DiscountManager } from "@/components/admin/DiscountManager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { DiscountCode } from "@/lib/types";

export const metadata = { title: "Kortingscodes" };

export default async function DiscountCodesAdmin() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
  const codes: DiscountCode[] = (data ?? []).map((c: DiscountCode) => ({ ...c, value: Number(c.value) }));
  return (
    <>
      <PageHeader title="Kortingscodes"
        description="Maak zelf kortingscodes. Klanten vullen de code in bij het afrekenen. Een code verloopt automatisch zodra het maximale aantal keer gebruikt is." />
      <DiscountManager codes={codes} />
    </>
  );
}
