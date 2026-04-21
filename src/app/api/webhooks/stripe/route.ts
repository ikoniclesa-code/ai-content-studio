import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_TO_PLAN } from "@/constants/plans";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // ── Verify signature ──────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();

  // ── Idempotency check ─────────────────────────────────────────────────
  const { data: existingEvent } = await adminClient
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await adminClient.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown,
    processed: false,
  });

  // ── Handle events ─────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(adminClient, event.data.object as Stripe.Checkout.Session, stripe);
        break;

      case "invoice.paid":
        await handleInvoicePaid(adminClient, event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(adminClient, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(adminClient, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(adminClient, event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    await adminClient
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    await adminClient
      .from("webhook_events")
      .update({
        processed: false,
        payload: { ...event, processing_error: error instanceof Error ? error.message : "Unknown" } as unknown,
      })
      .eq("stripe_event_id", event.id);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  if (!item) return { start: 0, end: 0 };
  return {
    start: item.current_period_start,
    end: item.current_period_end,
  };
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "trialing" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}

// ─── checkout.session.completed ──────────────────────────────────────────────

async function handleCheckoutCompleted(
  adminClient: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    throw new Error("Missing supabase_user_id in session metadata");
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error("Missing subscription ID in checkout session");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const planConfig = priceId ? PRICE_TO_PLAN[priceId] : undefined;

  if (!planConfig) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // Save Stripe Customer ID on profile
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (customerId) {
    await adminClient
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const period = getSubscriptionPeriod(subscription);

  await adminClient.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId ?? null,
      plan_name: planConfig.planName,
      billing_period: planConfig.billingPeriod,
      status: "active",
      credits_per_period: planConfig.creditsPerMonth,
      current_period_start: new Date(period.start * 1000).toISOString(),
      current_period_end: new Date(period.end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Add credits atomically
  await adminClient.rpc("add_credits", {
    p_user_id: userId,
    p_amount: planConfig.creditsPerMonth,
    p_description: `Aktivacija plana: ${planConfig.label}`,
  });
}

// ─── invoice.paid ────────────────────────────────────────────────────────────

async function handleInvoicePaid(
  adminClient: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice,
) {
  if (invoice.billing_reason === "subscription_create") return;

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("user_id, plan_name, credits_per_period")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!sub) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  await adminClient.rpc("reset_monthly_credits", {
    p_user_id: sub.user_id,
    p_credits_amount: sub.credits_per_period,
  });

  // Update subscription period from invoice
  await adminClient
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: new Date(invoice.period_start * 1000).toISOString(),
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);
}

// ─── customer.subscription.updated ───────────────────────────────────────────

async function handleSubscriptionUpdated(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  const priceId = subscription.items.data[0]?.price.id;
  const planConfig = priceId ? PRICE_TO_PLAN[priceId] : undefined;
  const status = mapStripeStatus(subscription.status);
  const period = getSubscriptionPeriod(subscription);

  const updateData: Record<string, unknown> = {
    status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(period.start * 1000).toISOString(),
    current_period_end: new Date(period.end * 1000).toISOString(),
  };

  if (planConfig) {
    updateData.stripe_price_id = priceId;
    updateData.plan_name = planConfig.planName;
    updateData.billing_period = planConfig.billingPeriod;
    updateData.credits_per_period = planConfig.creditsPerMonth;
  }

  await adminClient
    .from("subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id);
}

// ─── customer.subscription.deleted ───────────────────────────────────────────

async function handleSubscriptionDeleted(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  await adminClient
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);
}

// ─── invoice.payment_failed ──────────────────────────────────────────────────

async function handlePaymentFailed(
  adminClient: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  await adminClient
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);
}
