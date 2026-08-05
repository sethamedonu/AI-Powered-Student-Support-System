type AlertVariant = "error" | "success" | "info" | "warning";

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const styles: Record<AlertVariant, string> = {
  error:
    "bg-red-50/80 border-red-200 text-red-700 dark:bg-red-950/80 dark:border-red-800 dark:text-red-300",
  success:
    "bg-green-50/80 border-green-200 text-green-700 dark:bg-green-950/80 dark:border-green-800 dark:text-green-300",
  info: "bg-blue-50/80 border-blue-200 text-blue-700 dark:bg-blue-950/80 dark:border-blue-800 dark:text-blue-300",
  warning:
    "bg-yellow-50/80 border-yellow-200 text-yellow-700 dark:bg-yellow-950/80 dark:border-yellow-800 dark:text-yellow-300",
};

export function Alert({ variant = "info", children }: AlertProps) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </div>
  );
}
