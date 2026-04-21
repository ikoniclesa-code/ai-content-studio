"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  activeSubscriptions: { total: number; starter: number; pro: number };
  mrr: number;
  totalGenerations: number;
  generationsByType: { text: number; image: number; video: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Greška pri učitavanju");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Nije moguće učitati statistike.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E5E7EB] p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
          <p className="text-[#DC2626] mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm font-medium"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ukupno korisnika"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          label="Aktivne pretplate"
          value={stats.activeSubscriptions.total}
          detail={`Starter: ${stats.activeSubscriptions.starter} | Pro: ${stats.activeSubscriptions.pro}`}
          color="green"
        />
        <StatCard
          label="MRR (mesečni prihod)"
          value={`$${stats.mrr.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          color="purple"
        />
        <StatCard
          label="Ukupno generacija"
          value={stats.totalGenerations}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">
          Generacije po tipu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TypeCard
            label="Tekst"
            count={stats.generationsByType.text}
            icon="T"
            color="bg-blue-100 text-blue-700"
          />
          <TypeCard
            label="Slike"
            count={stats.generationsByType.image}
            icon="I"
            color="bg-green-100 text-green-700"
          />
          <TypeCard
            label="Video"
            count={stats.generationsByType.video}
            icon="V"
            color="bg-purple-100 text-purple-700"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string | number;
  detail?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "border-l-[#1A56DB]",
    green: "border-l-[#059669]",
    purple: "border-l-purple-600",
    orange: "border-l-[#D97706]",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E7EB] border-l-4 ${colorMap[color]} p-6`}
    >
      <p className="text-sm text-[#6B7280] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#111827]">{value}</p>
      {detail && (
        <p className="text-xs text-[#6B7280] mt-1">{detail}</p>
      )}
    </div>
  );
}

function TypeCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F9FAFB]">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#6B7280]">{label}</p>
        <p className="text-xl font-bold text-[#111827]">{count}</p>
      </div>
    </div>
  );
}
