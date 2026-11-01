import type { Metadata } from "next";
import { Confirmation } from "./Confirmation";

export const metadata: Metadata = { title: "Bestelbevestiging", robots: { index: false } };

export default function ConfirmationPage() {
  return <div className="container-luxe py-16 md:py-24"><Confirmation /></div>;
}
