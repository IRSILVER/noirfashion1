"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { imagesForColor } from "@/lib/pricing";
import type { ProductImage } from "@/lib/types";
import { useColor } from "./ColorContext";
import { ArrowIcon, CloseIcon, ZoomIcon } from "../icons";
import { ImagePlaceholder } from "./ImagePlaceholder";

export function ProductGallery({ images: allImages, name }: { images: ProductImage[]; name: string }) {
  const { color } = useColor();
  const images = imagesForColor(allImages, color);
  const [active, setActive] = useState(0);
  // Show the first photo again whenever another colour is chosen.
  useEffect(() => setActive(0), [color]);
  const [lightbox, setLightbox] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);

  const go = useCallback((dir: number) => setActive((i) => (i + dir + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox, go]);

  if (images.length === 0) {
    return <div className="relative aspect-[4/5] w-full bg-cream"><ImagePlaceholder label="Productfoto's volgen" /></div>;
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Productfoto's">
          {images.map((img, i) => (
            <button key={img.id} type="button" role="tab" aria-selected={i === active} aria-label={`Foto ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-cream transition-opacity md:w-full ${i === active ? "opacity-100 ring-1 ring-espresso ring-offset-2 ring-offset-ivory" : "opacity-55 hover:opacity-100"}`}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1">
        <button type="button" onClick={() => setLightbox(true)} aria-label="Foto vergroten"
          className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-cream"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          }}
          onMouseLeave={() => setOrigin(null)}>
          <Image key={current.id} src={current.url} alt={current.alt || name} fill priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out md:group-hover:scale-[1.7]"
            style={origin ? { transformOrigin: origin } : undefined} />
          <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-ivory/90 backdrop-blur">
            <ZoomIcon className="size-4" />
          </span>
        </button>
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between md:hidden">
            <button type="button" onClick={() => go(-1)} aria-label="Vorige foto" className="pointer-events-auto flex size-10 rotate-180 items-center justify-center rounded-full bg-ivory/85"><ArrowIcon /></button>
            <button type="button" onClick={() => go(1)} aria-label="Volgende foto" className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-ivory/85"><ArrowIcon /></button>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-noir/95" role="dialog" aria-modal="true" aria-label="Foto's bekijken">
          <button type="button" onClick={() => setLightbox(false)} className="absolute right-4 top-4 z-10 p-3 text-ivory" aria-label="Sluiten"><CloseIcon /></button>
          <div className="relative h-[86vh] w-[92vw] overflow-auto">
            <Image src={current.url} alt={current.alt || name} fill sizes="92vw" quality={90} className="object-contain" />
          </div>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Vorige foto" className="absolute left-3 top-1/2 flex size-12 -translate-y-1/2 rotate-180 items-center justify-center text-ivory"><ArrowIcon className="size-6" /></button>
              <button type="button" onClick={() => go(1)} aria-label="Volgende foto" className="absolute right-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-ivory"><ArrowIcon className="size-6" /></button>
              <p className="absolute bottom-5 text-xs tracking-[0.3em] text-ivory/70">{active + 1} / {images.length}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
