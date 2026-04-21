import { AlertTriangle, RefreshCw } from "lucide-react";

interface RetryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function RetryError({
  message = "Došlo je do greške pri učitavanju podataka.",
  onRetry,
  className = "",
}: RetryErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--error-bg)] mb-4">
        <AlertTriangle className="w-7 h-7 text-[var(--error)]" />
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-sm">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Pokušaj ponovo
        </button>
      )}
    </div>
  );
}
