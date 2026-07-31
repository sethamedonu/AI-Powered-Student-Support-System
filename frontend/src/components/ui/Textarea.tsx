import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId =
      id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
              : "border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-600 dark:focus:ring-primary-900",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
export { Textarea };
