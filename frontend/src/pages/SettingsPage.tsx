import { LogOut, Server, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/formatters";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Profile" description="Your SentinelAI analyst account" />
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-base-700 text-lg font-semibold text-ink">
            {user?.name?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink">{user?.name}</p>
            <p className="text-sm text-ink-muted">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-faint">
              <UserIcon className="h-3.5 w-3.5" /> Account ID
            </dt>
            <dd className="mt-1 truncate font-mono text-xs text-ink-muted">{user?.id}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-faint">
              <ShieldCheck className="h-3.5 w-3.5" /> Member since
            </dt>
            <dd className="mt-1 text-sm text-ink-muted">
              {user ? formatDate(user.created_at) : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Connection" description="Backend the app is currently talking to" />
        <div className="flex items-center gap-3 rounded-lg border border-border-light bg-base-900/60 px-4 py-3">
          <Server className="h-4 w-4 text-signal" />
          <code className="text-sm text-ink-muted">{apiBaseUrl}</code>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Set <code className="text-ink-muted">VITE_API_BASE_URL</code> in your{" "}
          <code className="text-ink-muted">.env</code> file to point at a different backend.
        </p>
      </Card>

      <Card>
        <CardHeader title="Session" description="Sign out of SentinelAI on this device" />
        <Button variant="danger" leftIcon={<LogOut className="h-4 w-4" />} onClick={logout}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
