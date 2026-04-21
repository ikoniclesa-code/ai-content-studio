import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { adminClient } = ctx;
    const { id } = await params;

    const [profileRes, subscriptionRes, creditsRes, generationsRes] =
      await Promise.all([
        adminClient.from("profiles").select("*").eq("id", id).single(),
        adminClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        adminClient
          .from("credit_transactions")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
        adminClient
          .from("generations")
          .select(
            "id, type, prompt_text, credits_used, status, created_at, ai_model",
          )
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      profile: profileRes.data,
      subscription: subscriptionRes.data ?? null,
      creditTransactions: creditsRes.data ?? [],
      generations: generationsRes.data ?? [],
    });
  } catch (error) {
    console.error("[/api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju korisnika." },
      { status: 500 },
    );
  }
}
