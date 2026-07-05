import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldHalf, Activity, Fingerprint, Terminal } from "lucide-react";

const FEATURES = [
  { icon: Terminal, label: "Automated log parsing" },
  { icon: Activity, label: "Real-time threat scoring" },
  { icon: Fingerprint, label: "Evidence-backed reporting" },
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full bg-base-950">
      {/* Brand panel — signature element: animated scan line over a network grid */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid bg-grid opacity-60" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-base-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-signal/60 shadow-[0_0_40px_4px_rgba(45,212,200,0.5)] animate-scan" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
            <ShieldHalf className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold text-ink">SentinelAI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative max-w-md"
        >
          <p className="font-display text-3xl font-semibold leading-tight text-ink">
            Five agents. One pipeline.
            <br />
            <span className="text-signal">Zero manual triage.</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Drop in a raw log file and let the Incident Manager, Log Parser,
            Threat Analyst, Knowledge Agent, and Report Generator work the
            case end to end.
          </p>

          <div className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-ink-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-base-800 text-signal">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative font-mono text-xs text-ink-faint">
          status: <span className="text-signal">operational</span> · model: llama3.2:3b
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
