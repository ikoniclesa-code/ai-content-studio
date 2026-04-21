"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="sr">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <svg
              className="w-8 h-8 text-[#DC2626]"
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

          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            Došlo je do greške
          </h1>
          <p className="text-[#6B7280] mb-8">
            Nešto je pošlo naopako. Naš tim je obavešten i radimo na rešenju.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2"
            >
              Pokušaj ponovo
            </button>
            <a
              href="/"
              className="w-full inline-block py-2.5 px-4 rounded-lg border border-[#E5E7EB] text-[#111827] font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Nazad na početnu
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
