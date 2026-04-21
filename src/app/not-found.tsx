import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-light)] mb-6">
          <Sparkles className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Stranica nije pronađena
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Stranica koju tražite ne postoji ili je premeštena.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Nazad na početnu
        </Link>
      </div>
    </div>
  );
}
