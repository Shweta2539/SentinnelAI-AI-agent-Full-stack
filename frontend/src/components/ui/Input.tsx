import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={[
              "w-full rounded-lg border bg-base-900/80 py-2.5 text-sm text-ink placeholder:text-ink-faint",
              "outline-none transition-colors focus:border-signal/60",
              icon ? "pl-10 pr-3" : "px-3",
              error ? "border-alert-critical/60" : "border-border-light",
              className,
            ].join(" ")}
            {...rest}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-alert-critical">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
