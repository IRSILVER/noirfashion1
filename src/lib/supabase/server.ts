import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Session-aware client for the admin area (server components & actions). */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a server component: cookies are refreshed by src/proxy.ts instead.
          }
        },
      },
    },
  );
}
