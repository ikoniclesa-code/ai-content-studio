import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { adminClient } = ctx;

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const plan = url.searchParams.get("plan") ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const perPage = 20;
    const offset = (page - 1) * perPage;

    let query = adminClient
      .from("profiles")
      .select("id, full_name, email, role, credits, is_blocked, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data: profiles, count, error } = await query;

    if (error) {
      console.error("[/api/admin/users] profiles query:", error);
      return NextResponse.json(
        { error: "Greška pri učitavanju korisnika." },
        { status: 500 },
      );
    }

    const userIds = (profiles ?? []).map((p) => p.id);
    let subscriptions: Record<string, { plan_name: string; status: string }> =
      {};

    if (userIds.length > 0) {
      const { data: subs } = await adminClient
        .from("subscriptions")
        .select("user_id, plan_name, status")
        .in("user_id", userIds)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false });

      if (subs) {
        for (const sub of subs) {
          if (!subscriptions[sub.user_id]) {
            subscriptions[sub.user_id] = {
              plan_name: sub.plan_name,
              status: sub.status,
            };
          }
        }
      }
    }

    let users = (profiles ?? []).map((p) => ({
      ...p,
      subscription: subscriptions[p.id] ?? null,
    }));

    if (plan === "starter" || plan === "pro") {
      users = users.filter((u) => u.subscription?.plan_name === plan);
    } else if (plan === "none") {
      users = users.filter((u) => !u.subscription);
    }

    return NextResponse.json({
      users,
      total: plan ? users.length : (count ?? 0),
      page,
      perPage,
    });
  } catch (error) {
    console.error("[/api/admin/users]", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju korisnika." },
      { status: 500 },
    );
  }
}
