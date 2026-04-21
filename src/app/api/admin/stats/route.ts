import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { PLANS } from "@/constants/plans";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { admin, adminClient, ip } = ctx;

    const [
      profilesRes,
      activeSubsRes,
      generationsRes,
      generationsByTypeRes,
    ] = await Promise.all([
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient
        .from("subscriptions")
        .select("plan_name, billing_period")
        .in("status", ["active", "trialing"]),
      adminClient
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      adminClient
        .from("generations")
        .select("type")
        .eq("status", "completed"),
    ]);

    const totalUsers = profilesRes.count ?? 0;
    const totalGenerations = generationsRes.count ?? 0;

    const activeSubs = activeSubsRes.data ?? [];
    const starterCount = activeSubs.filter(
      (s) => s.plan_name === "starter",
    ).length;
    const proCount = activeSubs.filter((s) => s.plan_name === "pro").length;

    let mrr = 0;
    for (const sub of activeSubs) {
      const plan = sub.plan_name as "starter" | "pro";
      const period = sub.billing_period as "monthly" | "yearly";
      if (period === "monthly") {
        mrr += PLANS[plan].monthlyUsd;
      } else {
        mrr += PLANS[plan].yearlyMonthlyUsd;
      }
    }

    const genByType = generationsByTypeRes.data ?? [];
    const textCount = genByType.filter((g) => g.type === "text").length;
    const imageCount = genByType.filter((g) => g.type === "image").length;
    const videoCount = genByType.filter((g) => g.type === "video").length;

    await logAdminAction(
      adminClient,
      admin.id,
      "view_stats",
      null,
      null,
      ip,
    );

    return NextResponse.json({
      totalUsers,
      activeSubscriptions: { total: activeSubs.length, starter: starterCount, pro: proCount },
      mrr: Math.round(mrr * 100) / 100,
      totalGenerations,
      generationsByType: { text: textCount, image: imageCount, video: videoCount },
    });
  } catch (error) {
    console.error("[/api/admin/stats]", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju statistika." },
      { status: 500 },
    );
  }
}
