"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type UseAuthOptions = {
  autoAnonymous?: boolean;
};

export function useAuth({ autoAnonymous = false }: UseAuthOptions = {}) {
  const supabase = useMemo(() => createClient(), []);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const loadProfile = useCallback(
    async (nextUser: User | null) => {
      if (!supabase || !nextUser) {
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setDebugError(formatAuthDebugError(profileError, "loadProfile"));
      }

      setProfile(data ?? null);
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugError(null);

    if (!supabase) {
      setError(getMissingSupabaseEnvMessage());
      setDebugError(formatAuthDebugError(null, "refresh:missing-client"));
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setDebugError(formatAuthDebugError(sessionError, "getSession"));
        setLoading(false);
        return;
      }

      let nextSession = data.session;

      if (!nextSession && autoAnonymous) {
        const anonymousResult = await supabase.auth.signInAnonymously();

        if (anonymousResult.error) {
          setError(anonymousResult.error.message);
          setDebugError(
            formatAuthDebugError(anonymousResult.error, "signInAnonymously")
          );
        }

        nextSession = anonymousResult.data.session;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
    } catch (caughtError) {
      setError(getAuthMessage(caughtError));
      setDebugError(formatAuthDebugError(caughtError, "refresh:catch"));
    } finally {
      setLoading(false);
    }
  }, [autoAnonymous, loadProfile, supabase]);

  const signInAnonymously = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugError(null);

    if (!supabase) {
      setError(getMissingSupabaseEnvMessage());
      setDebugError(formatAuthDebugError(null, "signInAnonymously:missing-client"));
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();

      if (signInError) {
        setError(signInError.message);
        setDebugError(formatAuthDebugError(signInError, "signInAnonymously"));
        setLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.user);
      await loadProfile(data.user);
    } catch (caughtError) {
      setError(getAuthMessage(caughtError));
      setDebugError(formatAuthDebugError(caughtError, "signInAnonymously:catch"));
    } finally {
      setLoading(false);
    }
  }, [loadProfile, supabase]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugError(null);

    if (!supabase) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        setDebugError(formatAuthDebugError(signOutError, "signOut"));
      }
    } catch (caughtError) {
      setError(getAuthMessage(caughtError));
      setDebugError(formatAuthDebugError(caughtError, "signOut:catch"));
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();

    if (!supabase) {
      return undefined;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void loadProfile(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, refresh, supabase]);

  return {
    debugError,
    error,
    loading,
    profile,
    refresh,
    session,
    signInAnonymously,
    signOut,
    supabase,
    user
  };
}

function getAuthMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Unknown auth error.";
}

function formatAuthDebugError(error: unknown, source: string) {
  const record =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const windowHref =
    typeof window === "undefined" ? "server-render" : window.location.href;

  return [
    `source=${source}`,
    `window.location.href=${windowHref}`,
    `name=${stringifyDebugValue(record.name)}`,
    `message=${stringifyDebugValue(record.message ?? getAuthMessage(error))}`,
    `code=${stringifyDebugValue(record.code)}`,
    `status=${stringifyDebugValue(record.status)}`,
    `stack=${stringifyDebugValue(record.stack)}`,
    `raw=${safeStringify(error)}`
  ].join("\n");
}

function stringifyDebugValue(value: unknown) {
  return value === undefined ? "undefined" : String(value);
}

function safeStringify(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (value instanceof Error) {
    return JSON.stringify(
      {
        message: value.message,
        name: value.name,
        stack: value.stack
      },
      null,
      2
    );
  }

  try {
    return JSON.stringify(value, Object.getOwnPropertyNames(value), 2);
  } catch {
    return String(value);
  }
}
