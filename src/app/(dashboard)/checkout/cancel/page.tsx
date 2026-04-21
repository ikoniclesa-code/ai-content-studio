import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-6">
            <svg
              className="w-8 h-8 text-[#D97706]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            Plaćanje otkazano
          </h1>
          <p className="text-[#6B7280] mb-8">
            Niste završili plaćanje. Nijedna transakcija nije izvršena. Možete
            pokušati ponovo kad god budete spremni.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="w-full inline-block py-2.5 px-4 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors text-center focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2"
            >
              Pogledaj planove ponovo
            </Link>
            <Link
              href="/dashboard"
              className="w-full inline-block py-2.5 px-4 rounded-lg border border-[#E5E7EB] text-[#111827] font-medium text-sm hover:bg-gray-50 transition-colors text-center"
            >
              Nazad na Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
