import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingSpinner({
  size = "md",
  className = "",
  label = "Učitavanje...",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={label}
    >
      <Loader2 className={`animate-spin text-[var(--accent)] ${sizes[size]}`} />
      {label && <p className="text-sm text-[var(--text-secondary)]">{label}</p>}
    </div>
  );
}
