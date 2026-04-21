"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--error-bg)] mb-6">
          <AlertTriangle className="w-8 h-8 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Serverska greška (500)
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Došlo je do neočekivane greške. Pokušajte ponovo ili se
          vratite na početnu stranicu.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Pokušaj ponovo
          </button>
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium text-sm hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
