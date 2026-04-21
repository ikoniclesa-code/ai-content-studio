import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PRICE_TO_PLAN, STRIPE_PRICE_IDS } from "@/constants/plans";

const VALID_PRICE_IDS = new Set(Object.values(STRIPE_PRICE_IDS));

export async function POST(request: NextRequest) {
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

    // 2. Parse body
    let body: { priceId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Neispravan format zahteva." },
        { status: 400 },
      );
    }

    const { priceId } = body;
    if (!priceId || !VALID_PRICE_IDS.has(priceId as typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS])) {
      return NextResponse.json(
        { error: "Neispravan cenovni plan." },
        { status: 400 },
      );
    }

    const planConfig = PRICE_TO_PLAN[priceId];
    if (!planConfig) {
      return NextResponse.json(
        { error: "Plan nije pronađen." },
        { status: 400 },
      );
    }

    // 3. Get or create Stripe Customer
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? "",
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });

      stripeCustomerId = customer.id;

      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);
    }

    // 4. Check for existing active subscription
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json(
        {
          error:
            "Već imate aktivnu pretplatu. Koristite portal za promenu plana.",
        },
        { status: 409 },
      );
    }

    // 5. Create Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        supabase_user_id: user.id,
        plan_name: planConfig.planName,
        billing_period: planConfig.billingPeriod,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_name: planConfig.planName,
          billing_period: planConfig.billingPeriod,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[/api/stripe/checkout] Error:", error);
    return NextResponse.json(
      { error: "Greška pri kreiranju sesije za plaćanje." },
      { status: 500 },
    );
  }
}
