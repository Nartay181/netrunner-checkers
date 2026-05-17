"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export function useAuth() {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const username = getUsername(user, profile);

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
      }

      if (data) {
        setProfile(data);
        return;
      }

      const fallbackUsername = getUsername(nextUser, null);
      const createdProfile = await ensureProfile(nextUser, fallbackUsername);

      setProfile(createdProfile);
    },
    [supabase]
  );

  const completeOAuthRedirect = useCallback(async () => {
    if (!supabase || typeof window === "undefined") {
      return null;
    }

    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams;
    const hashParams = new URLSearchParams(
      currentUrl.hash.startsWith("#")
        ? currentUrl.hash.slice(1)
        : currentUrl.hash
    );
    const oauthError =
      searchParams.get("error_description") ??
      hashParams.get("error_description") ??
      searchParams.get("error") ??
      hashParams.get("error");
    const code = searchParams.get("code");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hasOAuthHash = Boolean(
      accessToken ||
        refreshToken ||
        hashParams.get("error") ||
        hashParams.get("error_description")
    );
    const hasOAuthPayload = Boolean(code || accessToken || oauthError);

    if (!hasOAuthPayload) {
      return null;
    }

    try {
      if (oauthError) {
        throw new Error(oauthError);
      }

      if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        return data.session;
      }

      if (accessToken && refreshToken) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          throw sessionError;
        }

        return data.session;
      }

      return null;
    } finally {
      clearOAuthParams(currentUrl, hasOAuthHash);
    }
  }, [supabase]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError(getMissingSupabaseEnvMessage());
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      await completeOAuthRedirect();

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      let nextSession = data.session;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
    } catch (caughtError) {
      setError(getAuthMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [completeOAuthRedirect, loadProfile, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      if (!supabase) {
        const message = getMissingSupabaseEnvMessage();

        setError(message);
        setLoading(false);
        return { error: message };
      }

      try {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (signInError) {
          setError(signInError.message);
          return { error: signInError.message };
        }

        setSession(data.session);
        setUser(data.user);
        await loadProfile(data.user);

        return { error: null };
      } catch (caughtError) {
        const message = getAuthMessage(caughtError);

        setError(message);
        return { error: message };
      } finally {
        setLoading(false);
      }
    },
    [loadProfile, supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, nextUsername: string) => {
      setLoading(true);
      setError(null);

      if (!supabase) {
        const message = getMissingSupabaseEnvMessage();

        setError(message);
        setLoading(false);
        return { error: message, needsConfirmation: false };
      }

      const normalizedUsername = sanitizeUsername(nextUsername);

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              city: "Almaty",
              display_name: normalizedUsername,
              username: normalizedUsername
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return { error: signUpError.message, needsConfirmation: false };
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.user);
        }

        if (data.user && data.session) {
          const createdProfile = await ensureProfile(data.user, normalizedUsername);

          setProfile(createdProfile);
        }

        return { error: null, needsConfirmation: !data.session };
      } catch (caughtError) {
        const message = getAuthMessage(caughtError);

        setError(message);
        return { error: message, needsConfirmation: false };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

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
      }
    } catch (caughtError) {
      setError(getAuthMessage(caughtError));
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
    error,
    loading,
    profile,
    refresh,
    session,
    signIn,
    signUp,
    signOut,
    supabase,
    user,
    username
  };

  async function ensureProfile(nextUser: User, nextUsername: string) {
    if (!supabase) {
      return null;
    }

    const normalizedUsername = sanitizeUsername(nextUsername);

    const profilePayload: ProfileInsert = {
      city: "Almaty",
      elo: 1000,
      id: nextUser.id,
      username: normalizedUsername
    };

    const { data, error: upsertError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("*")
      .single();

    if (upsertError) {
      setError(upsertError.message);
      return null;
    }

    return data;
  }
}

export type AuthController = ReturnType<typeof useAuth>;

function getAuthMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Unknown auth error.";
}

function sanitizeUsername(username: string) {
  return username.trim().replace(/\s+/g, "_").slice(0, 32) || "ALMATY_RUNNER";
}

function getUsername(user: User | null, profile: Profile | null) {
  if (profile?.display_name) {
    return profile.display_name;
  }

  if (profile?.username) {
    return profile.username;
  }

  const metadataDisplayName = getMetadataString(user, [
    "full_name",
    "name",
    "display_name",
    "username"
  ]);

  if (metadataDisplayName) {
    return metadataDisplayName;
  }

  return user?.email?.split("@")[0] ?? "UNAUTHENTICATED";
}

function getMetadataString(user: User | null, keys: string[]) {
  for (const key of keys) {
    const value = user?.user_metadata?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function clearOAuthParams(currentUrl: URL, clearHash: boolean) {
  const authSearchParams = [
    "code",
    "error",
    "error_code",
    "error_description",
    "provider",
    "state"
  ];

  authSearchParams.forEach((param) => currentUrl.searchParams.delete(param));

  if (clearHash) {
    currentUrl.hash = "";
  }

  window.history.replaceState(
    window.history.state,
    document.title,
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
  );
}
