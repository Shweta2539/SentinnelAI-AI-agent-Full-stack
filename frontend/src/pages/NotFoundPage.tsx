import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-base-950 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/10 text-signal">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link to="/dashboard">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}
