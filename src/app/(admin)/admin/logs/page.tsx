"use client";

import { useEffect, useState, useCallback } from "react";

interface LogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin_email: string;
  admin_name: string | null;
  target_email: string | null;
  target_name: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  view_stats: "Pregled statistika",
  credit_adjustment: "Podešavanje kredita",
  block_user: "Blokiranje korisnika",
  unblock_user: "Odblokiranje korisnika",
  impersonation: "Impersonacija",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const perPage = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Admin Logovi</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
        >
          <option value="">Sve akcije</option>
          <option value="view_stats">Pregled statistika</option>
          <option value="credit_adjustment">Podešavanje kredita</option>
          <option value="block_user">Blokiranje</option>
          <option value="unblock_user">Odblokiranje</option>
          <option value="impersonation">Impersonacija</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Datum
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Admin
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Akcija
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Korisnik
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Detalji
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#6B7280]"
                  >
                    Nema logova.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("sr-Latn")}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#111827] text-xs">
                          {log.admin_name || log.admin_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-[#111827]">
                      {log.target_email || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] max-w-xs">
                      <DetailsCell details={log.details} />
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] text-xs font-mono">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
            <p className="text-sm text-[#6B7280]">Ukupno: {total} logova</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-white transition-colors"
              >
                ← Prethodna
              </button>
              <span className="px-3 py-1.5 text-sm text-[#6B7280]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-white transition-colors"
              >
                Sledeća →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    view_stats: "bg-gray-100 text-gray-700",
    credit_adjustment: "bg-orange-100 text-orange-700",
    block_user: "bg-red-100 text-red-700",
    unblock_user: "bg-green-100 text-green-700",
    impersonation: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colorMap[action] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

function DetailsCell({
  details,
}: {
  details: Record<string, unknown> | null;
}) {
  if (!details) return <span>—</span>;

  const entries = Object.entries(details);
  if (entries.length === 0) return <span>—</span>;

  const summary = entries
    .filter(([k]) => k !== "target_email" && k !== "target_name")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return (
    <span className="text-xs truncate block max-w-xs" title={summary}>
      {summary || "—"}
    </span>
  );
}
