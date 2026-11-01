"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="heading-display text-4xl">Er ging iets mis</h1>
      <p className="mt-4 max-w-sm text-sm text-brown">Probeer het opnieuw. Blijft het probleem bestaan, neem dan contact met ons op.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-dark">Opnieuw proberen</button>
        <Link href="/" className="btn btn-outline">Naar home</Link>
      </div>
    </div>
  );
}
