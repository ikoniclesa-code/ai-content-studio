"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-lg w-full">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--error-bg)] mb-5">
            <AlertTriangle className="w-7 h-7 text-[var(--error)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Greška pri učitavanju
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Došlo je do greške pri učitavanju ove stranice. Pokušajte ponovo ili
            se obratite podršci ako problem potraje.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="py-2.5 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Pokušaj ponovo
            </button>
            <Link
              href="/dashboard"
              className="py-2.5 px-6 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium text-sm hover:bg-[var(--bg-secondary)] transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
