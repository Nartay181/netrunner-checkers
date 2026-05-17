import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let warnedMissingClientEnv = false;

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
