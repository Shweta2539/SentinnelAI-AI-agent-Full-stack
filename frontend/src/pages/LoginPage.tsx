import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldHalf, AlertCircle } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import type { LoginPayload } from "../types/auth";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>();

  const onSubmit = async (values: LoginPayload) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(values);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
          <ShieldHalf className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-semibold text-ink">SentinelAI</span>
      </div>

      <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Sign in to resume monitoring your active investigations.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          placeholder="jane@sentinelai.dev"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required.",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email." },
          })}
        />

        <Input
          label="Password"
          type="password"
          icon={<Lock className="h-4 w-4" />}
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Password is required." })}
        />

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-3 py-2.5 text-sm text-alert-critical">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-signal hover:text-signal-bright">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
