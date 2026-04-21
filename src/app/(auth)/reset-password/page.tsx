"use client";

import { resetPasswordAction, type AuthActionState } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { showError, showSuccess } from "@/lib/toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2"
    >
      {pending && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {pending ? "Slanje emaila..." : "Pošalji link za reset"}
    </button>
  );
}

const initialState: AuthActionState = {};

export default function ResetPasswordPage() {
  const [state, action] = useActionState(resetPasswordAction, initialState);

  useEffect(() => {
    if (state.error) showError(state.error);
    if (state.success) showSuccess(state.success);
  }, [state.error, state.success]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#111827]">Reset lozinke</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Unesite vašu email adresu i poslaćemo vam link za reset lozinke.
        </p>
      </div>

      {/* Error poruka */}
      {state.error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#DC2626]">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-3.5a.75.75 0 00-1.5 0v3.5zm.75-6a1 1 0 110 2 1 1 0 010-2z"
              clipRule="evenodd"
            />
          </svg>
          {state.error}
        </div>
      )}

      {/* Success poruka */}
      {state.success ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-[#059669]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#111827]">{state.success}</p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Proverite spam folder ako email nije stigao.
          </p>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#111827] mb-1"
            >
              Email adresa
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vase@email.com"
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition"
            />
          </div>
          <SubmitButton />
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Sećate se lozinke?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#1A56DB] hover:text-[#1E40AF] transition-colors"
        >
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
