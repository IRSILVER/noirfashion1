"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Used in the admin dashboard for direct photo uploads to Supabase Storage. */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
