"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, Mail, Terminal, User } from "lucide-react";
import type { AuthController } from "@/hooks/useAuth";

type AuthPanelProps = {
  auth: AuthController;
  open: boolean;
};

type AuthMode = "login" | "register";

export function AuthPanel({ auth, open }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [password, setPassword] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM]: Identity firewall engaged.",
    "[TRACE]: Awaiting operator credentials."
  ]);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [username, setUsername] = useState("");
  const title =
    mode === "login" ? "ACCESS_LOGIN" : "INITIALIZE_REGISTRATION";
  const primaryActionLabel = mode === "register" ? "CREATE ACCOUNT" : "SIGN IN";
  const primaryLoadingLabel =
    mode === "register" ? "CREATING ACCOUNT" : "SIGNING IN";
  const validationHint = useMemo(
    () => getValidationHint({ email, mode, password, username }),
    [email, mode, password, username]
  );
  const canSubmit = !validationHint;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (auth.loading) {
      return;
    }

    if (validationHint) {
      pushLog(validationHint);
      return;
    }

    pushLog(`[SYSTEM]: ${title} sequence transmitted.`);

    const result =
      mode === "login"
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password, username.trim());

    if (result.error) {
      pushLog(`[AUTH_FAILURE]: ${result.error}`);
      return;
    }

    if ("needsConfirmation" in result && result.needsConfirmation) {
      pushLog("[AUTH_PENDING]: Confirm email link to complete handshake.");
      return;
    }

    pushLog("[AUTH_SUCCESS]: Secure session established.");
  }

  async function handleGoogleSignIn() {
    if (auth.loading || oauthLoading) {
      return;
    }

    pushLogs([
      "[SYSTEM]: Initiating Google identity matrix decryption...",
      "[SYSTEM]: Redirecting to secure OAuth node."
    ]);

    const supabase = auth.supabase;

    if (!supabase) {
      pushLog("[AUTH_FAILURE]: Supabase uplink unavailable.");
      return;
    }

    setOauthLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        pushLog(`[AUTH_FAILURE]: ${error.message}`);
        setOauthLoading(false);
        return;
      }

      if (!data.url) {
        pushLog("[SYSTEM]: Google OAuth handoff accepted.");
        setOauthLoading(false);
      }
    } catch (caughtError) {
      pushLog(`[AUTH_FAILURE]: ${getAuthPanelMessage(caughtError)}`);
      setOauthLoading(false);
    }
  }

  function pushLog(log: string) {
    pushLogs([log]);
  }

  function pushLogs(logs: string[]) {
    setTerminalLogs((current) => [...logs, ...current].slice(0, 8));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/88 px-4 py-8 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="cyber-panel relative w-full max-w-xl overflow-hidden rounded-lg border border-matrix/45 bg-black/80 p-5 shadow-[0_0_70px_rgba(0,255,65,0.18)]"
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyber/70"
              animate={{ y: [0, 520] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-cyber/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md border border-matrix/45 bg-matrix/10 shadow-matrix-soft">
                  <Terminal className="h-5 w-5 text-matrix" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-cyber/70">
                    secure identity layer
                  </p>
                  <h2 className="text-xl font-black uppercase text-white">
                    {title}
                  </h2>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-matrix shadow-matrix-hard" />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border border-cyber/20 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={getModeClass(mode === "login", "cyber")}
              >
                ACCESS_LOGIN
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={getModeClass(mode === "register", "matrix")}
              >
                INITIALIZE_REGISTRATION
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {mode === "register" && (
                <AuthField
                  icon={User}
                  label="Username"
                  onChange={setUsername}
                  placeholder="ALMATY_RUNNER"
                  value={username}
                />
              )}
              <AuthField
                icon={Mail}
                label="Email"
                onChange={setEmail}
                placeholder="operator@netrunner.kz"
                type="email"
                value={email}
              />
              <AuthField
                icon={KeyRound}
                label="Password"
                onChange={setPassword}
                placeholder="********"
                type="password"
                value={password}
              />

              <motion.button
                type="submit"
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                disabled={auth.loading}
                className={[
                  "mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3.5 text-sm font-black uppercase tracking-[0.08em] transition duration-200 disabled:cursor-wait disabled:opacity-65",
                  canSubmit
                    ? "border-matrix bg-[#00ff66] text-black shadow-[0_0_24px_rgba(0,255,102,0.38)] hover:bg-matrix hover:shadow-[0_0_36px_rgba(0,255,102,0.56)]"
                    : "border-matrix/45 bg-zinc-950 text-matrix shadow-matrix-soft hover:border-matrix hover:bg-matrix/10"
                ].join(" ")}
              >
                {auth.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                )}
                {auth.loading ? primaryLoadingLabel : primaryActionLabel}
              </motion.button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cyber/55">
              <span className="h-px flex-1 bg-cyber/20" />
              <span>OR CONTINUE WITH</span>
              <span className="h-px flex-1 bg-cyber/20" />
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleGoogleSignIn}
              disabled={auth.loading || oauthLoading}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-cyber/35 bg-white px-4 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_0_22px_rgba(0,243,255,0.12)] transition duration-200 hover:border-cyber hover:shadow-cyber-soft disabled:cursor-wait disabled:opacity-65"
            >
              {oauthLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-cyber" aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              {oauthLoading ? "CONNECTING GOOGLE" : "SIGN IN WITH GOOGLE"}
            </motion.button>

            <div className="mt-5 grid gap-2">
              {(validationHint ? [validationHint] : [])
                .concat(auth.error ? [`[AUTH_FAILURE]: ${auth.error}`] : [])
                .concat(terminalLogs)
                .map((log, index) => (
                  <motion.p
                    key={`${log}-${index}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={[
                      "border-l px-3 py-2 text-xs leading-relaxed",
                      log.includes("FAILURE")
                        ? "border-danger bg-danger/10 text-danger"
                        : log.includes("awaiting compliance")
                          ? "border-cyber bg-cyber/8 text-cyber"
                          : index === 0
                          ? "border-matrix bg-matrix/8 text-matrix"
                          : "border-cyber/25 bg-black/35 text-cyber/80"
                    ].join(" ")}
                  >
                    {log}
                  </motion.p>
                ))}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type AuthFieldProps = {
  icon: typeof Mail;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
};

function AuthField({
  icon: Icon,
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: AuthFieldProps) {
  return (
    <label className="grid gap-1 text-xs uppercase text-cyber/75">
      {label}
      <span className="group flex items-center gap-2 rounded-md border border-cyber/25 bg-black/60 px-3 py-2 transition focus-within:border-matrix/70 focus-within:shadow-matrix-soft">
        <Icon className="h-4 w-4 shrink-0 text-cyber/70 group-focus-within:text-matrix" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-cyber/30"
        />
      </span>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.6 12.23c0-.74-.07-1.46-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.44z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.25-2.51c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.58-4.11H3.07v2.59A9.99 9.99 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.42 13.91A6.01 6.01 0 0 1 6.1 12c0-.66.11-1.3.32-1.91V7.5H3.07A9.96 9.96 0 0 0 2 12c0 1.61.39 3.13 1.07 4.5l3.35-2.59z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.88-2.88C16.95 2.96 14.69 2 12 2a9.99 9.99 0 0 0-8.93 5.5l3.35 2.59C7.21 7.73 9.41 5.98 12 5.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

function getModeClass(active: boolean, tone: "cyber" | "matrix") {
  const activeClass =
    tone === "matrix"
      ? "bg-matrix/12 text-matrix shadow-matrix-soft"
      : "bg-cyber/12 text-cyber shadow-cyber-soft";

  return [
    "rounded px-3 py-2 text-[10px] font-black uppercase transition",
    active ? activeClass : "text-cyber/55 hover:text-cyber"
  ].join(" ");
}

function getValidationHint({
  email,
  mode,
  password,
  username
}: {
  email: string;
  mode: AuthMode;
  password: string;
  username: string;
}) {
  if (mode === "register" && username.trim().length < 2) {
    return "[TRACE]: Username must be at least 2 characters... awaiting compliance.";
  }

  if (!isValidEmail(email)) {
    return "[TRACE]: Email must include @ and a domain... awaiting compliance.";
  }

  if (password.length < 6) {
    return "[TRACE]: Password must be at least 6 characters... awaiting compliance.";
  }

  return null;
}

function isValidEmail(email: string) {
  const trimmedEmail = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
}

function getAuthPanelMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Unknown auth error.";
}
