"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProduct, setProductFlag } from "@/app/admin/actions";

export function ProductRowActions({ id, slug, name, published, soldOut }: { id: string; slug: string; name: string; published: boolean; soldOut: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    const res = await fn();
    if (!res.ok) alert(res.error ?? "Er ging iets mis.");
    router.refresh();
  });

  return (
    <div className={`flex flex-wrap gap-2 ${pending ? "opacity-50" : ""}`}>
      <Link href={`/admin/producten/${id}`} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">Bewerken</Link>
      <button type="button" disabled={pending} onClick={() => run(() => setProductFlag(id, "is_published", !published))} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">
        {published ? "Verbergen" : "Opnieuw publiceren"}
      </button>
      <button type="button" disabled={pending} onClick={() => run(() => setProductFlag(id, "is_sold_out", !soldOut))} className="a-btn a-btn-ghost min-h-9 px-3 text-xs">
        {soldOut ? "Weer beschikbaar" : "Uitverkocht"}
      </button>
      {published && <Link href={`/product/${slug}`} target="_blank" className="a-btn a-btn-ghost min-h-9 px-3 text-xs">Bekijk ↗</Link>}
      <button type="button" disabled={pending} className="a-btn a-btn-danger min-h-9 px-3 text-xs"
        onClick={() => confirm(`“${name}” definitief verwijderen? Foto's worden ook verwijderd. Bestaande bestellingen blijven bewaard.\n\nTip: kies “Verbergen” als je het product later misschien terug wilt.`) && run(() => deleteProduct(id))}>
        Verwijderen
      </button>
    </div>
  );
}
