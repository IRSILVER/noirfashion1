"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BagIcon, ChevronIcon, CloseIcon, MenuIcon, SearchIcon } from "../icons";
import { useCart } from "./CartProvider";
import { CartDrawer } from "./CartDrawer";
import { Logo } from "./Logo";

interface NavBrand { name: string; slug: string }

const NAV = [
  { href: "/collectie", label: "Collectie" },
  { href: "/collectie?nieuw=1", label: "Nieuw binnen" },
  { href: "/merken", label: "Merken", dropdown: true },
  { href: "/over-ons", label: "Over NOIR FASHION" },
  { href: "/contact", label: "Contact" },
];

export function Header({ brands, announcement }: { brands: NavBrand[]; announcement: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, ready, setDrawerOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    router.push(q ? `/collectie?q=${encodeURIComponent(q)}` : "/collectie");
    setSearchOpen(false);
  };

  return (
    <>
      {announcement && (
        <div className="bg-noir px-4 py-2.5 text-center text-[0.65rem] uppercase tracking-[0.28em] text-ivory/90">{announcement}</div>
      )}
      <header className={`sticky top-0 z-40 border-b transition-all duration-500 ${scrolled ? "border-line bg-ivory/95 backdrop-blur-md" : "border-transparent bg-ivory"}`}>
        <div className="container-luxe grid h-[76px] grid-cols-[1fr_auto_1fr] items-center md:h-[96px]">
          {/* left: menu (mobile) / nav (desktop) */}
          <div className="flex items-center">
            <button type="button" className="-ml-2 p-2 lg:hidden" aria-label="Menu openen" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <MenuIcon />
            </button>
            <nav aria-label="Hoofdmenu" className="hidden items-center gap-8 lg:flex">
              {NAV.slice(0, 3).map((item) => item.dropdown ? (
                <div key={item.href} className="group relative">
                  <Link href={item.href} className="link-underline flex items-center gap-1 text-[0.68rem] uppercase tracking-[0.24em]"
                    aria-current={pathname.startsWith("/merken") ? "page" : undefined}>
                    {item.label} <ChevronIcon className="size-3 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-6 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="grid w-[520px] grid-cols-2 gap-x-10 gap-y-3 border border-line bg-ivory p-8 shadow-[0_30px_60px_-30px_rgba(43,33,26,0.35)]">
                      {brands.map((b) => (
                        <Link key={b.slug} href={`/merken/${b.slug}`} className="font-serif text-lg text-espresso transition-colors hover:text-champagne">{b.name}</Link>
                      ))}
                      <Link href="/merken" className="col-span-2 mt-3 border-t border-line pt-4 text-[0.65rem] uppercase tracking-[0.24em] text-champagne">Alle merken bekijken</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href} className="link-underline text-[0.68rem] uppercase tracking-[0.24em]"
                  aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
              ))}
            </nav>
          </div>

          <Logo height={64} priority className="hidden md:inline-block" />
          <Logo height={50} priority className="inline-block md:hidden" />

          {/* right: links + search + cart */}
          <div className="flex items-center justify-end gap-1 md:gap-3">
            <nav aria-label="Informatie" className="mr-5 hidden items-center gap-8 xl:flex">
              {NAV.slice(3).map((item) => (
                <Link key={item.href} href={item.href} className="link-underline text-[0.68rem] uppercase tracking-[0.24em]"
                  aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
              ))}
            </nav>
            <button type="button" className="p-2" aria-label="Zoeken" onClick={() => setSearchOpen((v) => !v)}><SearchIcon /></button>
            <button type="button" className="relative -mr-2 p-2" aria-label={`Winkelwagen, ${count} ${count === 1 ? "artikel" : "artikelen"}`}
              onClick={() => setDrawerOpen(true)}>
              <BagIcon />
              {ready && count > 0 && (
                <span className="absolute right-0 top-0 flex size-[18px] items-center justify-center rounded-full bg-noir text-[0.6rem] text-ivory">{count}</span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line bg-ivory">
            <form onSubmit={submitSearch} className="container-luxe flex items-center gap-4 py-5" role="search">
              <SearchIcon className="size-5 text-taupe" />
              <label htmlFor="site-search" className="sr-only">Zoek in de collectie</label>
              <input ref={searchRef} id="site-search" name="q" type="search" placeholder="Zoek op product of merk…"
                className="flex-1 bg-transparent py-2 font-serif text-2xl outline-none placeholder:text-taupe/60" />
              <button type="submit" className="btn btn-dark hidden sm:inline-flex">Zoeken</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-noir/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-fade-up flex-col overflow-y-auto bg-ivory">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="eyebrow">Menu</span>
              <button type="button" className="p-2" aria-label="Menu sluiten" onClick={() => setMenuOpen(false)}><CloseIcon /></button>
            </div>
            <nav className="flex flex-col px-5 py-6" aria-label="Mobiel menu">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="border-b border-line/70 py-4 font-serif text-2xl">{item.label}</Link>
              ))}
            </nav>
            <div className="px-5 pb-10">
              <p className="eyebrow mb-4">Merken</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {brands.map((b) => <Link key={b.slug} href={`/merken/${b.slug}`} className="text-sm text-brown">{b.name}</Link>)}
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
