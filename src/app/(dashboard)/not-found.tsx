import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-5">
            <svg
              className="w-7 h-7 text-[#1A56DB]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>

          <p className="text-5xl font-bold text-[#1A56DB] mb-2">404</p>
          <h2 className="text-xl font-bold text-[#111827] mb-2">
            Stranica nije pronađena
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Ova stranica ne postoji u okviru vašeg dashboard-a.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2"
          >
            Nazad na Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
