import Link from "next/link";
import { Empty, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPrice, whatsappNumber } from "@/lib/format";

export const metadata = { title: "Klantgegevens" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders")
    .select("id, customer_name, phone, snapchat, email, total, status, created_at")
    .order("created_at", { ascending: false }).limit(5000);

  // One customer per phone number (the required field).
  const map = new Map<string, { name: string; phone: string; snapchat: string | null; email: string | null; orders: number; spent: number; last: string; lastId: string }>();
  for (const o of data ?? []) {
    const key = o.phone;
    const c = map.get(key);
    if (!c) {
      map.set(key, { name: o.customer_name, phone: o.phone, snapchat: o.snapchat, email: o.email, orders: 1, spent: o.status === "cancelled" ? 0 : Number(o.total), last: o.created_at, lastId: o.id });
    } else {
      c.orders += 1;
      if (o.status !== "cancelled") c.spent += Number(o.total);
      c.snapchat ??= o.snapchat;
      c.email ??= o.email;
    }
  }
  let customers = [...map.values()];
  if (q) customers = customers.filter((c) => `${c.name} ${c.phone} ${c.snapchat ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Klantgegevens" description="Overzicht van klanten op basis van hun bestellingen. Deze gegevens zijn alleen zichtbaar voor beheerders — ga er zorgvuldig mee om." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Zoek naam, telefoon, Snapchat of e-mail…" className="a-input sm:w-80" /></form>
      {customers.length === 0 ? <Empty>Nog geen klanten.</Empty> : (
        <div className="a-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-cream/40 text-left text-[0.7rem] uppercase tracking-[0.06em] text-taupe">
              <tr><th className="px-4 py-3">Naam</th><th className="px-4 py-3">Telefoon</th><th className="px-4 py-3">Snapchat</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Bestellingen</th><th className="px-4 py-3 text-right">Besteed</th><th className="px-4 py-3">Laatste</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.phone} className="hover:bg-cream/40">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="whitespace-nowrap px-4 py-3"><a href={`https://wa.me/${whatsappNumber(c.phone)}`} target="_blank" rel="noopener noreferrer" className="underline">{c.phone}</a></td>
                  <td className="px-4 py-3">{c.snapchat ?? <span className="text-taupe">—</span>}</td>
                  <td className="px-4 py-3">{c.email ? <a href={`mailto:${c.email}`} className="underline">{c.email}</a> : <span className="text-taupe">—</span>}</td>
                  <td className="px-4 py-3"><Link href={`/admin/bestellingen?q=${encodeURIComponent(c.phone)}`} className="underline">{c.orders}</Link></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPrice(c.spent)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-taupe"><Link href={`/admin/bestellingen/${c.lastId}`} className="hover:underline">{formatDate(c.last)}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
