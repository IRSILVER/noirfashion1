import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Winkelwagen", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-luxe py-14 md:py-20">
      <h1 className="heading-display mb-12 text-5xl md:text-6xl">Winkelwagen</h1>
      <CartView />
    </div>
  );
}
