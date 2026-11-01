import Link from "next/link";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-taupe">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function StatCard({ label, value, href, highlight = false }: { label: string; value: number | string; href?: string; highlight?: boolean }) {
  const inner = (
    <div className={`a-card h-full p-5 transition-colors ${highlight ? "border-champagne bg-[#fffaf1]" : ""} ${href ? "hover:border-champagne" : ""}`}>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-taupe">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="a-card px-6 py-14 text-center text-sm text-taupe">{children}</div>;
}
