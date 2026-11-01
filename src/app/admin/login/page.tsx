import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inloggen" };

export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  if (configured && (await getAdmin())) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Image src="/brand/logo-transparent.png" alt="NOIR FASHION" width={110} height={119} className="mx-auto" priority />
        <h1 className="heading-display mt-10 text-center text-3xl">Dashboard</h1>
        <p className="mt-2 text-center text-sm text-taupe">Log in om je webshop te beheren.</p>
        {configured ? <LoginForm /> : (
          <p className="mt-8 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Supabase is nog niet gekoppeld. Vul <code>NEXT_PUBLIC_SUPABASE_URL</code> en <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in (zie README).
          </p>
        )}
      </div>
    </div>
  );
}
