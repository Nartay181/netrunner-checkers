"use client";

import { Activity, MapPin, RadioTower, ShieldCheck, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Database } from "@/utils/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type PlayerProfilePanelProps = {
  authenticated: boolean;
  email?: string | null;
  loading?: boolean;
  profile: Profile | null;
  username: string;
};

export function PlayerProfilePanel({
  authenticated,
  email,
  loading,
  profile,
  username
}: PlayerProfilePanelProps) {
  const elo = profile?.elo ?? 1000;
  const tier = getTierTitle(elo);
  const city = profile?.city?.trim() || "Almaty";
  const displayName = username || profile?.username || "UNAUTHENTICATED";

  return (
    <section className="cyber-panel min-w-0 overflow-hidden rounded-lg border border-matrix/25 bg-black/55">
      <div className="flex items-center justify-between gap-3 border-b border-cyber/20 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs font-black uppercase text-matrix sm:text-sm">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">Player Profile</span>
        </div>
        <span
          className={[
            "shrink-0 rounded-md border px-2 py-1 text-[10px] font-black uppercase",
            authenticated
              ? "border-matrix/45 bg-matrix/10 text-matrix shadow-matrix-soft"
              : "border-danger/45 bg-danger/10 text-danger"
          ].join(" ")}
        >
          {authenticated ? "Online" : "Locked"}
        </span>
      </div>

      <div className="grid gap-4 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <motion.div
            aria-hidden="true"
            className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-cyber/40 bg-cyber/10 shadow-cyber-soft sm:h-20 sm:w-20"
            animate={{
              boxShadow: authenticated
                ? [
                    "0 0 18px rgba(0,243,255,0.22)",
                    "0 0 30px rgba(0,255,65,0.28)",
                    "0 0 18px rgba(0,243,255,0.22)"
                  ]
                : undefined
            }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,243,255,0.16)_1px,transparent_1px),linear-gradient(rgba(0,255,65,0.14)_1px,transparent_1px)] bg-[length:10px_10px]" />
            <motion.span
              className="absolute h-20 w-7 rotate-12 bg-cyber/18 blur-sm"
              animate={{ x: ["-180%", "180%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            <UserRound className="relative z-10 h-8 w-8 text-matrix sm:h-10 sm:w-10" />
          </motion.div>

          <div className="min-w-0">
            <p className="truncate text-base font-black uppercase text-white sm:text-lg">
              {loading ? "SYNCING_PROFILE" : displayName}
            </p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-cyber/70">
              {authenticated ? email ?? "Secure session" : "Auth module pending"}
            </p>
          </div>
        </div>

        {authenticated ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <ProfileMetric
                icon={<Activity className="h-4 w-4" aria-hidden="true" />}
                label="Elo Rating"
                value={elo.toLocaleString()}
              />
              <ProfileMetric
                icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                label="Tier"
                value={tier}
              />
            </div>

            <div className="rounded-md border border-cyber/20 bg-black/45 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyber/65">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Location Node
              </div>
              <p className="truncate text-sm font-black uppercase text-white">
                NODE: {city}, KZ
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-danger/30 bg-danger/8 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-danger">
              <RadioTower className="h-4 w-4" aria-hidden="true" />
              Identity Matrix Offline
            </div>
            <p className="text-[11px] uppercase leading-relaxed text-cyber/80 sm:text-xs">
              Login or initialize registration through the system auth module to
              unlock Elo, location node, and match archive telemetry.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type ProfileMetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function ProfileMetric({ icon, label, value }: ProfileMetricProps) {
  return (
    <div className="min-w-0 rounded-md border border-matrix/20 bg-matrix/8 px-3 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-matrix/65">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="truncate text-sm font-black uppercase text-white">{value}</p>
    </div>
  );
}

function getTierTitle(elo: number) {
  if (elo >= 1600) {
    return "ROOT ARCHITECT";
  }

  if (elo >= 1400) {
    return "NEON OVERLORD";
  }

  if (elo >= 1200) {
    return "CYBER DAEMON";
  }

  if (elo >= 1100) {
    return "MATRIX STRIDER";
  }

  return "BRONZE RUNNER";
}
