import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Niste prijavljeni." },
        { status: 401 },
      );
    }

    // 2. Get Stripe Customer ID
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nemate Stripe nalog. Prvo izaberite plan." },
        { status: 400 },
      );
    }

    // 3. Create portal session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[/api/stripe/portal] Error:", error);
    return NextResponse.json(
      { error: "Greška pri otvaranju portala za upravljanje pretplatom." },
      { status: 500 },
    );
  }
}
