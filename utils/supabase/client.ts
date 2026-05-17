"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { publishableKey, url } = getSupabaseEnv();

  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}
