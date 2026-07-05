import { NavLink } from "react-router-dom";
import { ShieldHalf, LogOut } from "lucide-react";
import { NAV_ITEMS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

export function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-base-900/80 lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
          <ShieldHalf className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-signal">
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-signal" />
          </span>
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-ink">
            SentinelAI
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">
            Incident Response
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-signal/10 text-signal"
                  : "text-ink-muted hover:bg-base-700/60 hover:text-ink",
              ].join(" ")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-700 text-xs font-semibold text-ink">
            {user?.name?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-alert-critical/10 hover:text-alert-critical"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
