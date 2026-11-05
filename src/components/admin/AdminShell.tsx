"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getUnseenOrders, logout } from "@/app/admin/actions";
import { CloseIcon, MenuIcon } from "../icons";

const NAV = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/bestellingen", label: "Bestellingen", badge: true },
  { href: "/admin/producten", label: "Producten beheren" },
  { href: "/admin/producten/nieuw", label: "Product toevoegen" },
  { href: "/admin/voorraad", label: "Voorraad" },
  { href: "/admin/prijzen", label: "Prijzen" },
  { href: "/admin/merken", label: "Merken beheren" },
  { href: "/admin/categorieen", label: "Categorieën" },
  { href: "/admin/kortingscodes", label: "Kortingscodes" },
  { href: "/admin/klanten", label: "Klantgegevens" },
  { href: "/admin/instellingen", label: "Instellingen" },
];

export function AdminShell({ email, unseen, children }: { email: string; unseen: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(unseen);
  const [toast, setToast] = useState<string | null>(null);
  const last = useRef(unseen);

  useEffect(() => { setCount(unseen); last.current = unseen; }, [unseen]);
  useEffect(() => setOpen(false), [pathname]);

  // Check for new orders every 30 seconds while the dashboard is open.
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await getUnseenOrders();
        if (res.count > last.current && res.latest) {
          setToast(`Nieuwe bestelling ${res.latest.order_number} van ${res.latest.customer_name}`);
          router.refresh();
        }
        last.current = res.count;
        setCount(res.count);
      } catch { /* offline — try again next tick */ }
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
  }, [count, pathname]);

  // The most specific matching menu item is highlighted.
  const activeHref = NAV.map((n) => n.href)
    .filter((h) => pathname === h || pathname.startsWith(h + "/"))
    .sort((x, y) => y.length - x.length)[0];
  const isActive = (href: string) => href === activeHref;

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href}
          className={`flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors ${isActive(item.href) ? "bg-noir text-white" : "text-espresso hover:bg-cream"}`}>
          {item.label}
          {item.badge && count > 0 && (
            <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[0.7rem] font-medium ${isActive(item.href) ? "bg-white text-noir" : "bg-champagne text-white"}`}>{count}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-2 border-t border-line pt-4 text-sm">
      <p className="truncate px-3 text-xs text-taupe" title={email}>{email}</p>
      <Link href="/" target="_blank" className="block rounded-sm px-3 py-2 hover:bg-cream">Bekijk webshop ↗</Link>
      <form action={logout}><button type="submit" className="w-full rounded-sm px-3 py-2 text-left hover:bg-cream">Uitloggen</button></form>
    </div>
  );

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-line bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-3">
          <Image src="/brand/monogram-transparent.png" alt="" width={40} height={33} />
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em]">Dashboard</span>
        </Link>
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="-ml-1 p-1.5" aria-label="Menu openen"><MenuIcon /></button>
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/brand/monogram-transparent.png" alt="" width={34} height={28} />
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.25em]">Dashboard</span>
        </Link>
        <Link href="/admin/bestellingen" className="relative p-1.5 text-sm" aria-label={`Bestellingen, ${count} nieuw`}>
          Bestellingen
          {count > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-champagne px-1 text-center text-[0.65rem] text-white">{count}</span>}
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-noir/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 overflow-y-auto bg-white px-4 py-5">
            <div className="flex items-center justify-between px-3">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em]">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Sluiten"><CloseIcon /></button>
            </div>
            <div className="flex-1">{nav}</div>
            {footer}
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-10">{children}</main>

      {toast && (
        <div role="status" className="fixed right-4 top-4 z-[70] flex max-w-sm animate-toast items-start gap-4 border border-champagne bg-white p-4 shadow-xl">
          <div className="flex-1">
            <p className="text-sm font-medium">🛍 Nieuwe bestelling</p>
            <p className="mt-1 text-sm text-brown">{toast}</p>
            <Link href="/admin/bestellingen" onClick={() => setToast(null)} className="mt-2 inline-block text-sm underline">Bekijken</Link>
          </div>
          <button type="button" onClick={() => setToast(null)} aria-label="Sluiten"><CloseIcon className="size-4" /></button>
        </div>
      )}
    </div>
  );
}
