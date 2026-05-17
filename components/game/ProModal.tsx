"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  LockKeyhole,
  Sparkles,
  X,
  Zap
} from "lucide-react";

type ProModalProps = {
  open: boolean;
  onClose: () => void;
};

const benefits = [
  "Deep Kernel Coach analytics + full match replays",
  "Premium Node Skins: Cyber Pink, Neon Amber, Kazakh Futurism",
  "Unlimited sessions + remove cooldowns",
  "Priority in Almaty Leaderboard"
];

export function ProModal({ open, onClose }: ProModalProps) {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (open) {
      setApproved(false);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/78 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="cyber-panel relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border-danger/35"
          >
            <div className="flex items-center justify-between border-b border-danger/25 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md border border-danger/50 bg-danger/10 shadow-danger-soft">
                  <Crown className="h-5 w-5 text-danger" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-danger/75">
                    monetize breach layer
                  </p>
                  <h2 className="text-xl font-black uppercase text-white">
                    Upgrade to Root Access (Pro)
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-md border border-cyber/25 text-cyber transition hover:border-danger/60 hover:text-danger"
                aria-label="Close Pro modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.1fr]">
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-3 rounded-md border border-cyber/18 bg-black/35 p-3 text-sm text-cyber"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-matrix" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <form
                className="rounded-lg border border-danger/25 bg-black/40 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setApproved(true);
                }}
              >
                {!approved ? (
                  <div className="grid gap-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-bold uppercase text-danger">
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Payment Node
                    </div>
                    <PaymentInput label="Card number" placeholder="4242 4242 4242 4242" />
                    <div className="grid grid-cols-2 gap-3">
                      <PaymentInput label="Expiry" placeholder="08 / 29" />
                      <PaymentInput label="CVC" placeholder="0x999" />
                    </div>
                    <PaymentInput label="Name" placeholder="JONAY RUNNER" />
                    <motion.button
                      type="submit"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-danger/60 bg-danger/12 px-4 py-3 text-xs font-black uppercase text-danger shadow-danger-soft"
                    >
                      <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                      Confirm Transact: $4.99/mo
                    </motion.button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid min-h-[292px] place-items-center text-center"
                  >
                    <div>
                      <motion.div
                        animate={{ rotate: [0, -2, 2, 0], scale: [1, 1.06, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-matrix/70 bg-matrix/10 shadow-matrix-hard"
                      >
                        <CheckCircle2 className="h-8 w-8 text-matrix" />
                      </motion.div>
                      <p className="mt-5 text-lg font-black uppercase text-white">
                        Transaction approved
                      </p>
                      <p className="mt-2 text-sm uppercase leading-relaxed text-matrix">
                        Root access granted.
                      </p>
                      <p className="mt-4 flex items-center justify-center gap-2 text-xs uppercase text-cyber">
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                        Premium breach layer unlocked
                      </p>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaymentInput({
  label,
  placeholder
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1 text-xs uppercase text-cyber/75">
      {label}
      <input
        placeholder={placeholder}
        className="rounded-md border border-cyber/25 bg-black/65 px-3 py-2 text-sm uppercase text-white outline-none transition placeholder:text-white/25 focus:border-matrix/70"
      />
    </label>
  );
}
