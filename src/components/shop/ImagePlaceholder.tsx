import Image from "next/image";

/** Shown until real product photos are uploaded. Never pretends to be a product photo. */
export function ImagePlaceholder({ label = "Foto volgt" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream">
      <Image src="/brand/monogram-transparent.png" alt="" width={90} height={74} className="opacity-25" />
      <span className="text-[0.62rem] uppercase tracking-[0.3em] text-taupe">{label}</span>
    </div>
  );
}
