"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5">
            <svg
              className="w-7 h-7 text-[#DC2626]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[#111827] mb-2">
            Greška u Admin panelu
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Došlo je do greške. Pokušajte ponovo ili se vratite na admin
            dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="py-2.5 px-6 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2"
            >
              Pokušaj ponovo
            </button>
            <Link
              href="/admin"
              className="py-2.5 px-6 rounded-lg border border-[#E5E7EB] text-[#111827] font-medium text-sm hover:bg-gray-50 transition-colors text-center"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
