import { Loader2 } from "lucide-react";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 className="h-6 w-6 animate-spin text-signal" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-base-950">
      <Spinner label="Booting SentinelAI" />
    </div>
  );
}
