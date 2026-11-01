import Image from "next/image";
import Link from "next/link";
import { CONDITION_LABELS } from "@/lib/format";
import { isAvailable, priceRange } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { Price } from "./Price";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [first, second] = product.images;
  const available = isAvailable(product);
  const { price, compareAt, varies } = priceRange(product);
  const sizes = product.variants.filter((v) => v.stock > 0).map((v) => v.size);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {first ? (
          <>
            <Image src={first.url} alt={first.alt || `${product.brand?.name ?? ""} ${product.name}`} fill priority={priority}
              sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 50vw"
              className={`object-cover transition-all duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""} ${available ? "" : "grayscale-[40%]"}`} />
            {second && (
              <Image src={second.url} alt="" fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            )}
          </>
        ) : <ImagePlaceholder />}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!available && <span className="bg-noir px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-ivory">Uitverkocht</span>}
          {available && product.is_new_arrival && <span className="bg-ivory/90 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-espresso backdrop-blur">Nieuw binnen</span>}
          {available && compareAt && <span className="bg-[#8b3a2a] px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-ivory">Sale</span>}
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {product.brand && <p className="text-[0.62rem] uppercase tracking-[0.28em] text-champagne">{product.brand.name}</p>}
        <h3 className="font-serif text-lg leading-snug text-espresso transition-colors group-hover:text-brown">{product.name}</h3>
        <p className="text-[0.72rem] text-taupe">{CONDITION_LABELS[product.condition]}{sizes.length > 0 && ` · ${sizes.join(", ")}`}</p>
        <Price price={price} compareAt={compareAt} from={varies} className="pt-1 text-[0.95rem]" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < priorityCount} />)}
    </div>
  );
}
