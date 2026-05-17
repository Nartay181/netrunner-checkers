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

  // Оптимизировано для мобильных тач-скринов: выносим асинхронный поток из дефолтного ивента
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (auth.loading) {
      return;
    }

    if (validationHint) {
      pushLog(validationHint);
      return;
    }

    pushLog(`[SYSTEM]: ${title} sequence transmitted.`);

    (async () => {
      try {
        const result =
            mode === "login"
                ? await auth.signIn(email.trim(), password)
                : await auth.signUp(email.trim(), password, username.trim());

        if (result && "error" in result && result.error) {
          pushLog(`[AUTH_FAILURE]: ${result.error}`);
          return;
        }

        if (result && "needsConfirmation" in result && result.needsConfirmation) {
          pushLog("[AUTH_PENDING]: Confirm email link to complete handshake.");
          return;
        }

        pushLog("[AUTH_SUCCESS]: Secure session established.");
      } catch (err) {
        pushLog(`[AUTH_FAILURE]: ${getAuthPanelMessage(err)}`);
      }
    })();
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
      const fallbackRedirect = typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "https://netrunner-checkers.vercel.app";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: fallbackRedirect,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        pushLog(`[AUTH_FAILURE]: ${error.message}`);
        setOauthLoading(false);
        return;
      }

      if (data?.url) {
        window.location.replace(data.url);
        return;
      }

      setOauthLoading(false);
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
                // Подняли z-index до максимума [9999], чтобы избежать перекрытий слоев на мобилках
                className="fixed inset-0 z-[9999] grid place-items-center overflow-x-hidden overflow-y-auto bg-black/88 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
              <motion.section
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="cyber-panel relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-matrix/45 bg-black/80 p-4 shadow-[0_0_70px_rgba(0,255,65,0.18)] sm:p-5"
              >
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyber/70"
                    animate={{ y: [0, 520] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-cyber/20 pb-4 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-matrix/45 bg-matrix/10 shadow-matrix-soft sm:h-11 sm:w-11">
                  <Terminal className="h-4 w-4 text-matrix sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] uppercase tracking-[0.22em] text-cyber/70 sm:text-[10px] sm:tracking-[0.32em]">
                        secure identity layer
                      </p>
                      <h2 className="truncate text-base font-black uppercase text-white sm:text-xl">
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

                  {/* Убран motion.button — теперь это стабильная кнопка с нативным тачем active:scale */}
                  <button
                      type="submit"
                      disabled={auth.loading}
                      className={[
                        "mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3.5 text-sm font-black uppercase tracking-[0.08em] transition-all duration-150 disabled:cursor-wait disabled:opacity-65",
                        canSubmit
                            ? "border-matrix bg-[#00ff66] text-black shadow-[0_0_24px_rgba(0,255,102,0.38)] active:scale-[0.98] hover:bg-matrix"
                            : "border-matrix/45 bg-zinc-950 text-matrix shadow-matrix-soft active:scale-[0.98] hover:bg-matrix/10"
                      ].join(" ")}
                  >
                    {auth.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Terminal className="h-4 w-4" aria-hidden="true" />
                    )}
                    {auth.loading ? primaryLoadingLabel : primaryActionLabel}
                  </button>
                </form>

                <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cyber/55">
                  <span className="h-px flex-1 bg-cyber/20" />
                  <span className="shrink-0">OR CONTINUE WITH</span>
                  <span className="h-px flex-1 bg-cyber/20" />
                </div>

                {/* Кнопка Google тоже переведена на нативный клик, убирающий зависания анимаций на iOS/Android */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={auth.loading || oauthLoading}
                    className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-cyber/35 bg-white px-4 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_0_22px_rgba(0,243,255,0.12)] transition-all duration-150 active:scale-[0.98] hover:border-cyber hover:shadow-cyber-soft disabled:cursor-wait disabled:opacity-65"
                >
                  {oauthLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-cyber" aria-hidden="true" />
                  ) : (
                      <GoogleMark />
                  )}
                  {oauthLoading ? "CONNECTING GOOGLE" : "SIGN IN WITH GOOGLE"}
                </button>

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
                                "break-words border-l px-3 py-2 text-[11px] leading-relaxed sm:text-xs",
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

// Компонент переписан с div вместо label, чтобы убрать мобильные баги с фокусом полей и прыгающей клавиатурой
function AuthField({
                     icon: Icon,
                     label,
                     onChange,
                     placeholder,
                     type = "text",
                     value
                   }: AuthFieldProps) {
  return (
      <div className="grid gap-1 text-xs uppercase text-cyber/75">
        <span>{label}</span>
        <div className="group flex items-center gap-2 rounded-md border border-cyber/25 bg-black/60 px-3 py-2 transition focus-within:border-matrix/70 focus-within:shadow-matrix-soft">
          <Icon className="h-4 w-4 shrink-0 text-cyber/70 group-focus-within:text-matrix" />
          <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              type={type}
              name={label.toLowerCase()}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-cyber/30"
          />
        </div>
      </div>
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