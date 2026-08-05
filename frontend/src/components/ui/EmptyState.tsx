interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
