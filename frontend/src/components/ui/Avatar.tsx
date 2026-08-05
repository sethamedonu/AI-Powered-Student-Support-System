interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function Avatar({ initials, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizeClass[size]} flex shrink-0 items-center justify-center rounded-full bg-primary-600 font-semibold text-white`}
    >
      {initials}
    </div>
  );
}
