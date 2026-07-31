import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, className = "", ...props }, ref) => {
    const inputId =
      id ?? `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

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
        <select
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
            "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-600 dark:focus:ring-primary-900",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
