"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserDetail {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    credits: number;
    is_blocked: boolean;
    language: string;
    theme: string;
    onboarding_completed: boolean;
    stripe_customer_id: string | null;
    created_at: string;
    updated_at: string;
  };
  subscription: {
    plan_name: string;
    billing_period: string | null;
    status: string;
    credits_per_period: number | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  creditTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    balance_after: number | null;
    created_at: string;
  }[];
  generations: {
    id: string;
    type: string;
    prompt_text: string | null;
    credits_used: number;
    status: string;
    created_at: string;
    ai_model: string | null;
  }[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Greška pri učitavanju korisnika.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreditAdjust() {
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount === 0) {
      toast.error("Unesite validan iznos (pozitivan za dodavanje, negativan za oduzimanje).");
      return;
    }
    if (!creditReason.trim() || creditReason.trim().length < 3) {
      toast.error("Razlog je obavezan (minimum 3 karaktera).");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          reason: creditReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Greška.");
        return;
      }
      toast.success(json.message);
      setCreditAmount("");
      setCreditReason("");
      setShowCreditForm(false);
      fetchUser();
    } catch {
      toast.error("Greška pri podešavanju kredita.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBlock() {
    if (!data) return;
    const isBlocked = data.profile.is_blocked;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          blocked: !isBlocked,
          reason: blockReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Greška.");
        return;
      }
      toast.success(json.message);
      setShowBlockConfirm(false);
      setBlockReason("");
      fetchUser();
    } catch {
      toast.error("Greška pri blokiranju.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleImpersonate() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Greška.");
        return;
      }
      toast.success(json.message);
    } catch {
      toast.error("Greška pri impersonaciji.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E5E7EB] p-6 animate-pulse h-48"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">Korisnik nije pronađen.</p>
        <Link
          href="/admin/users"
          className="text-[#1A56DB] hover:underline text-sm mt-2 inline-block"
        >
          ← Nazad na listu
        </Link>
      </div>
    );
  }

  const { profile, subscription, creditTransactions, generations } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          ← Korisnici
        </Link>
        <span className="text-[#E5E7EB]">/</span>
        <h1 className="text-xl font-bold text-[#111827]">
          {profile.full_name || profile.email}
        </h1>
        {profile.is_blocked && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
            Blokiran
          </span>
        )}
      </div>

      {/* Profil i pretplata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="font-semibold text-[#111827] mb-4">Profil</h2>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Ime" value={profile.full_name || "—"} />
            <InfoRow label="Uloga" value={profile.role} />
            <InfoRow label="Jezik" value={profile.language} />
            <InfoRow
              label="Onboarding"
              value={profile.onboarding_completed ? "Završen" : "Nije završen"}
            />
            <InfoRow
              label="Registrovan"
              value={new Date(profile.created_at).toLocaleString("sr-Latn")}
            />
            <InfoRow
              label="Stripe ID"
              value={profile.stripe_customer_id || "—"}
            />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="font-semibold text-[#111827] mb-4">Pretplata</h2>
          {subscription ? (
            <dl className="space-y-3 text-sm">
              <InfoRow
                label="Plan"
                value={
                  subscription.plan_name === "pro" ? "Pro" : "Starter"
                }
              />
              <InfoRow
                label="Period"
                value={
                  subscription.billing_period === "yearly"
                    ? "Godišnje"
                    : "Mesečno"
                }
              />
              <InfoRow label="Status" value={subscription.status} />
              <InfoRow
                label="Krediti/period"
                value={String(subscription.credits_per_period ?? "—")}
              />
              <InfoRow
                label="Kraj perioda"
                value={
                  subscription.current_period_end
                    ? new Date(
                        subscription.current_period_end,
                      ).toLocaleDateString("sr-Latn")
                    : "—"
                }
              />
              <InfoRow
                label="Otkazuje se"
                value={subscription.cancel_at_period_end ? "Da" : "Ne"}
              />
            </dl>
          ) : (
            <p className="text-sm text-[#6B7280]">Nema aktivnu pretplatu.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="font-semibold text-[#111827] mb-4">Krediti</h2>
          <p className="text-3xl font-bold text-[#111827] mb-4">
            {profile.credits}
          </p>

          <div className="space-y-2">
            <button
              onClick={() => setShowCreditForm(!showCreditForm)}
              className="w-full px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
            >
              Podesi kredite
            </button>
            <button
              onClick={() => setShowBlockConfirm(!showBlockConfirm)}
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                profile.is_blocked
                  ? "bg-[#059669] text-white hover:bg-green-700"
                  : "bg-[#DC2626] text-white hover:bg-red-700"
              }`}
            >
              {profile.is_blocked ? "Odblokiraj" : "Blokiraj"}
            </button>
            <button
              onClick={handleImpersonate}
              disabled={actionLoading}
              className="w-full px-4 py-2 text-sm font-medium border border-[#E5E7EB] text-[#111827] rounded-lg hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Uloguj se kao korisnik
            </button>
          </div>
        </div>
      </div>

      {/* Kredit forma */}
      {showCreditForm && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-semibold text-[#111827] mb-4">
            Podesi kredite
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Iznos (+ za dodavanje, - za oduzimanje)
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="npr. 100 ili -50"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Razlog (obavezno)
              </label>
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="npr. Kompenzacija za bug"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreditAdjust}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Obrađujem..." : "Primeni"}
            </button>
            <button
              onClick={() => setShowCreditForm(false)}
              className="px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* Block confirm */}
      {showBlockConfirm && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-semibold text-[#111827] mb-4">
            {profile.is_blocked
              ? "Odblokirati korisnika?"
              : "Blokirati korisnika?"}
          </h3>
          {!profile.is_blocked && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Razlog (opciono)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="npr. Kršenje uslova korišćenja"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleBlock}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                profile.is_blocked
                  ? "bg-[#059669] hover:bg-green-700"
                  : "bg-[#DC2626] hover:bg-red-700"
              }`}
            >
              {actionLoading
                ? "Obrađujem..."
                : profile.is_blocked
                  ? "Odblokiraj"
                  : "Blokiraj"}
            </button>
            <button
              onClick={() => setShowBlockConfirm(false)}
              className="px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* Istorija kredita */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#111827]">
            Istorija kredita (poslednjih 50)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Datum
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Tip
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-[#6B7280]">
                  Iznos
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-[#6B7280]">
                  Saldo
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Opis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {creditTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-[#6B7280]"
                  >
                    Nema transakcija.
                  </td>
                </tr>
              ) : (
                creditTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-2.5 text-[#6B7280]">
                      {new Date(tx.created_at).toLocaleString("sr-Latn")}
                    </td>
                    <td className="px-4 py-2.5">
                      <TypeBadge type={tx.type} />
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium ${
                        tx.amount > 0 ? "text-[#059669]" : "text-[#DC2626]"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#111827]">
                      {tx.balance_after ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#6B7280] max-w-xs truncate">
                      {tx.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Istorija generacija */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#111827]">
            Generacije (poslednjih 50)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Datum
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Tip
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Prompt
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-[#6B7280]">
                  Krediti
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-[#6B7280]">
                  Model
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {generations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-[#6B7280]"
                  >
                    Nema generacija.
                  </td>
                </tr>
              ) : (
                generations.map((gen) => (
                  <tr key={gen.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-2.5 text-[#6B7280]">
                      {new Date(gen.created_at).toLocaleString("sr-Latn")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          gen.type === "text"
                            ? "bg-blue-100 text-blue-700"
                            : gen.type === "image"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {gen.type === "text"
                          ? "Tekst"
                          : gen.type === "image"
                            ? "Slika"
                            : "Video"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#111827] max-w-xs truncate">
                      {gen.prompt_text || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#111827]">
                      {gen.credits_used}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-medium ${
                          gen.status === "completed"
                            ? "text-[#059669]"
                            : gen.status === "failed"
                              ? "text-[#DC2626]"
                              : "text-[#D97706]"
                        }`}
                      >
                        {gen.status === "completed"
                          ? "Uspešno"
                          : gen.status === "failed"
                            ? "Neuspelo"
                            : "U toku"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#6B7280]">
                      {gen.ai_model || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="text-[#111827] font-medium text-right">{value}</dd>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    subscription_credit: {
      label: "Pretplata",
      className: "bg-blue-100 text-blue-700",
    },
    text_gen: { label: "Tekst", className: "bg-gray-100 text-gray-700" },
    image_gen: { label: "Slika", className: "bg-green-100 text-green-700" },
    video_gen: { label: "Video", className: "bg-purple-100 text-purple-700" },
    admin_adjustment: {
      label: "Admin",
      className: "bg-orange-100 text-orange-700",
    },
  };

  const entry = map[type] ?? { label: type, className: "bg-gray-100 text-gray-700" };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}
