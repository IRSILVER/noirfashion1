import { CartProvider } from "@/components/shop/CartProvider";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { getBrands, getSettings } from "@/lib/catalog";

export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [brands, settings] = await Promise.all([getBrands(), getSettings()]);
  return (
    <CartProvider>
      <a href="#inhoud" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-noir focus:px-4 focus:py-2 focus:text-ivory">
        Naar de inhoud
      </a>
      <Header brands={brands.map((b) => ({ name: b.name, slug: b.slug }))} announcement={settings.announcement} />
      <main id="inhoud">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
