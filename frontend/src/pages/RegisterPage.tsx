import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { AlertCircle, Lock, Mail, ShieldHalf, User as UserIcon } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import type { RegisterPayload } from "../types/auth";

interface RegisterFormValues extends RegisterPayload {
  confirmPassword: string;
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const password = watch("password");

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { name, email, password: pwd } = values;
      await registerUser({ name, email, password: pwd });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed.");
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

      <h2 className="font-display text-2xl font-semibold text-ink">Create your account</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Start triaging incidents with your AI analyst team.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Input
          label="Full name"
          type="text"
          icon={<UserIcon className="h-4 w-4" />}
          placeholder="Jane Analyst"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name", { required: "Name is required." })}
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required.",
            minLength: { value: 8, message: "Use at least 8 characters." },
          })}
        />

        <Input
          label="Confirm password"
          type="password"
          icon={<Lock className="h-4 w-4" />}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password.",
            validate: (value) => value === password || "Passwords do not match.",
          })}
        />

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-3 py-2.5 text-sm text-alert-critical">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-signal hover:text-signal-bright">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
