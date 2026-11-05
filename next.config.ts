import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      // old brand URL → new short URL
      { source: "/merken/fear-of-god-essentials", destination: "/merken/essentials", permanent: true },
      // the old "Collectie" / "Shop nu" page is gone: searches and filters move to /zoeken, the rest to the brand overview
      { source: "/collectie", has: [{ type: "query", key: "q" }], destination: "/zoeken", permanent: true },
      { source: "/collectie", has: [{ type: "query", key: "nieuw" }], destination: "/zoeken", permanent: true },
      { source: "/collectie", has: [{ type: "query", key: "categorie" }], destination: "/zoeken", permanent: true },
      { source: "/collectie", destination: "/merken", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
