import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let warnedMissingClientEnv = false;

if (typeof window !== "undefined") {
  (window as Window & { __SUPABASE_DEBUG_URL?: string }).__SUPABASE_DEBUG_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  (
    window as Window & { __SUPABASE_DEBUG_KEY_TYPE?: string }
  ).__SUPABASE_DEBUG_KEY_TYPE =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8);

  console.log("[SUPABASE DEBUG]: client bootstrap", {
    anonKeyPrefix: supabaseAnonKey.substring(0, 8),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasUrl: Boolean(supabaseUrl),
    href: window.location.href,
    url: supabaseUrl
  });
}

export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          // Disable URL token parsing so Vercel preview/deploy URLs cannot
          // trigger Supabase auth callback path errors during app boot.
          detectSessionInUrl: false,
          persistSession: true
        }
      })
    : createNullSupabaseClient();

export function getSupabaseClient() {
  return supabase;
}

function createNullSupabaseClient() {
  if (!warnedMissingClientEnv) {
    warnedMissingClientEnv = true;
    console.warn(getMissingSupabaseEnvMessage());
  }

  return null;
}
