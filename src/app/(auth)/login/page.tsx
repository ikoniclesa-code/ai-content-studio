"use client";

import { loginAction, type AuthActionState } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { showError, showWarning } from "@/lib/toast";
import { Loader2, AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
    >
      {pending && <Loader2 className="animate-spin h-4 w-4" />}
      {pending ? "Prijavljivanje..." : "Prijavi se"}
    </button>
  );
}

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (state.error) showError(state.error);
  }, [state.error]);

  useEffect(() => {
    const error = searchParams.get("error");
    const redirectTo = searchParams.get("redirectTo");
    if (error === "auth_error") showError("Greška pri autentifikaciji. Pokušajte ponovo.");
    if (error === "blocked") showError("Vaš nalog je blokiran. Kontaktirajte podršku.");
    if (redirectTo) showWarning("Sesija je istekla. Prijavite se ponovo.");
  }, [searchParams]);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Prijava</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Unesite vaše podatke za pristup aplikaciji.
        </p>
      </div>

      {state.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 px-4 py-3 text-sm text-[var(--error)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Email adresa
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vase@email.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)]">
              Lozinka
            </label>
            <Link href="/reset-password" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
              Zaboravili ste lozinku?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
          />
        </div>

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Nemate nalog?{" "}
        <Link href="/register" className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
          Registrujte se
        </Link>
      </p>
    </div>
  );
}
