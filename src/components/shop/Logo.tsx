import Image from "next/image";
import Link from "next/link";

/** The original NOIR FASHION logo (background removed, proportions untouched). */
export function Logo({ height = 64, priority = false, className = "" }: { height?: number; priority?: boolean; className?: string }) {
  const width = Math.round((height * 701) / 757);
  return (
    <Link href="/" aria-label="NOIR FASHION — naar de homepage" className={className || "inline-block"}>
      <Image src="/brand/logo-transparent.png" alt="NOIR FASHION" width={width} height={height} priority={priority}
        style={{ width: "auto", height }} />
    </Link>
  );
}
