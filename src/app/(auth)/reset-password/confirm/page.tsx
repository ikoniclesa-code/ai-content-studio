"use client";

import {
  updatePasswordAction,
  type AuthActionState,
} from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
      {pending ? "Postavljanje lozinke..." : "Postavi novu lozinku"}
    </button>
  );
}

const initialState: AuthActionState = {};

export default function ConfirmResetPage() {
  const [state, action] = useActionState(updatePasswordAction, initialState);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#111827]">Nova lozinka</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Unesite novu lozinku za vaš nalog.
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
          {state.error.includes("istekao") && (
            <Link
              href="/reset-password"
              className="ml-1 underline font-medium hover:no-underline"
            >
              Zatraži novi link.
            </Link>
          )}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#111827] mb-1"
          >
            Nova lozinka
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Najmanje 8 karaktera"
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition"
          />
        </div>
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-[#111827] mb-1"
          >
            Potvrdite novu lozinku
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition"
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
