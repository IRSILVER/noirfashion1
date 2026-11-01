import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 text-center">
      <Link href="/" aria-label="NOIR FASHION"><Image src="/brand/logo-transparent.png" alt="NOIR FASHION" width={120} height={130} /></Link>
      <p className="eyebrow mt-14">404</p>
      <h1 className="heading-display mt-4 text-4xl md:text-5xl">Deze pagina bestaat niet</h1>
      <p className="mt-5 max-w-sm text-sm text-brown">Misschien is het item inmiddels verkocht of is de link veranderd.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/collectie" className="btn btn-dark">Naar de collectie</Link>
        <Link href="/" className="btn btn-outline">Naar home</Link>
      </div>
    </div>
  );
}
