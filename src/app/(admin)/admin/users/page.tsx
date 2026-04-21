"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  credits: number;
  is_blocked: boolean;
  created_at: string;
  subscription: { plan_name: string; status: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (plan) params.set("plan", plan);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, plan, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, plan]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Korisnici</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Pretraži po imenu ili emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent bg-white"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
        >
          <option value="">Svi planovi</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="none">Bez pretplate</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Korisnik
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Krediti
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                  Registrovan
                </th>
                <th className="text-right px-4 py-3 font-medium text-[#6B7280]">
                  Akcije
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
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#6B7280]"
                  >
                    Nema pronađenih korisnika.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#111827]">
                          {user.full_name || "—"}
                        </p>
                        <p className="text-xs text-[#6B7280]">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.subscription.plan_name === "pro"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.subscription.plan_name === "pro"
                            ? "Pro"
                            : "Starter"}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6B7280]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111827]">
                      {user.credits}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_blocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Blokiran
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Aktivan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {new Date(user.created_at).toLocaleDateString("sr-Latn")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-[#1A56DB] hover:text-[#1E40AF] text-sm font-medium transition-colors"
                      >
                        Detalji →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
            <p className="text-sm text-[#6B7280]">
              Ukupno: {total} korisnika
            </p>
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
