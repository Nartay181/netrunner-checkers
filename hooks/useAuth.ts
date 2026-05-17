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
      }

      setProfile(data ?? null);
    },
    [supabase]
  );

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

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }

    let nextSession = data.session;

    if (!nextSession && autoAnonymous) {
      const anonymousResult = await supabase.auth.signInAnonymously();

      if (anonymousResult.error) {
        setError(anonymousResult.error.message);
      }

      nextSession = anonymousResult.data.session;
    }

    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    await loadProfile(nextSession?.user ?? null);
    setLoading(false);
  }, [autoAnonymous, loadProfile, supabase]);

  const signInAnonymously = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError(getMissingSupabaseEnvMessage());
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSession(data.session);
    setUser(data.user);
    await loadProfile(data.user);
    setLoading(false);
  }, [loadProfile, supabase]);

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

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
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
    signInAnonymously,
    signOut,
    supabase,
    user
  };
}
