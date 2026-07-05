import { Menu, Radio } from "lucide-react";
import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload": "Upload Logs",
  "/investigations": "Investigations",
  "/reports": "Reports",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  const exact = TITLES[pathname];
  if (exact) return exact;

  const match = Object.keys(TITLES).find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : "SentinelAI";
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-base-900/60 px-4 backdrop-blur-sm lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-ink-muted hover:bg-base-700 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-ink">
          {resolveTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border-light bg-base-800/80 px-3 py-1.5 text-xs text-ink-muted">
        <Radio className="h-3.5 w-3.5 text-signal" />
        <span className="hidden sm:inline">Live monitoring active</span>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
        </span>
      </div>
    </header>
  );
}
