import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-300",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:ring-2 focus:ring-offset-0",
            "bg-white text-slate-900 dark:bg-slate-800/60 dark:text-slate-100",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/40"
              : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:focus:ring-indigo-900/40 dark:focus:border-indigo-400",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
