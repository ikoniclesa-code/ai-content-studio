import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { adminClient } = ctx;

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const action = url.searchParams.get("action") ?? "";
    const perPage = 30;
    const offset = (page - 1) * perPage;

    let query = adminClient
      .from("admin_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (action) {
      query = query.eq("action", action);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      console.error("[/api/admin/logs] query:", error);
      return NextResponse.json(
        { error: "Greška pri učitavanju logova." },
        { status: 500 },
      );
    }

    const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id))];
    const targetIds = [
      ...new Set(
        (logs ?? [])
          .map((l) => l.target_user_id)
          .filter(Boolean) as string[],
      ),
    ];
    const allUserIds = [...new Set([...adminIds, ...targetIds])];

    let userMap: Record<string, { email: string; full_name: string | null }> =
      {};

    if (allUserIds.length > 0) {
      const { data: users } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .in("id", allUserIds);

      if (users) {
        for (const u of users) {
          userMap[u.id] = { email: u.email, full_name: u.full_name };
        }
      }
    }

    const enrichedLogs = (logs ?? []).map((log) => ({
      ...log,
      admin_email: userMap[log.admin_id]?.email ?? "Nepoznat",
      admin_name: userMap[log.admin_id]?.full_name ?? null,
      target_email: log.target_user_id
        ? userMap[log.target_user_id]?.email ?? null
        : null,
      target_name: log.target_user_id
        ? userMap[log.target_user_id]?.full_name ?? null
        : null,
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      total: count ?? 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error("[/api/admin/logs]", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju logova." },
      { status: 500 },
    );
  }
}
