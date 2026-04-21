"use client";

import { registerAction, type AuthActionState } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { showError, showSuccess } from "@/lib/toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
    >
      {pending && <Loader2 className="animate-spin h-4 w-4" />}
      {pending ? "Registracija u toku..." : "Kreiraj nalog"}
    </button>
  );
}

const initialState: AuthActionState = {};

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, initialState);

  useEffect(() => {
    if (state.error) showError(state.error);
    if (state.success) showSuccess(state.success);
  }, [state.error, state.success]);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Kreirajte nalog</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Počnite besplatno — nema kreditne kartice.
        </p>
      </div>

      {state.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--error-bg)] border border-[var(--error)]/20 px-4 py-3 text-sm text-[var(--error)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--success-bg)] border border-[var(--success)]/20 px-4 py-3 text-sm text-[var(--success)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      {!state.success && (
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Puno ime
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Marko Marković"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Lozinka
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Najmanje 8 karaktera"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Potvrdite lozinku
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition"
            />
          </div>

          <SubmitButton />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Već imate nalog?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
