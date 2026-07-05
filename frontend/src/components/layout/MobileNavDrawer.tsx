import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { LogOut, ShieldHalf, X } from "lucide-react";
import { NAV_ITEMS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { logout, user } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-base-950/70 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-base-900 lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22 }}
          >
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
                  <ShieldHalf className="h-5 w-5" />
                </div>
                <p className="font-display text-sm font-semibold text-ink">SentinelAI</p>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-ink-muted hover:bg-base-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3">
              {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
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
              <p className="mb-3 truncate px-3 text-xs text-ink-faint">{user?.email}</p>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-alert-critical/10 hover:text-alert-critical"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
