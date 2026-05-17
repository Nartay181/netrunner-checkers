let warnedMissingEnv = false;

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabaseEnv() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    warnMissingSupabaseEnv();
    return null;
  }

  return { anonKey, url };
}

function warnMissingSupabaseEnv() {
  if (warnedMissingEnv) {
    return;
  }

  warnedMissingEnv = true;

  console.warn(
    [
      "Missing Supabase env.",
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      "Supabase features will be disabled until these are available."
    ].join(" ")
  );
}

export function getMissingSupabaseEnvMessage() {
  return (
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export function createMissingSupabaseEnvError() {
  warnMissingSupabaseEnv();
  return new Error(getMissingSupabaseEnvMessage());
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
