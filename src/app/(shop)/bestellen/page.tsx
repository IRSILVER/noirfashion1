import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Bestelling plaatsen", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-luxe py-14 md:py-20">
      <p className="eyebrow">Bijna klaar</p>
      <h1 className="heading-display mb-12 mt-4 text-5xl md:text-6xl">Bestelling plaatsen</h1>
      <CheckoutForm />
    </div>
  );
}
