import { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";

export interface CreditCheckResult {
  hasSubscription: boolean;
  hasEnoughCredits: boolean;
  currentCredits: number;
  required: number;
  subscriptionStatus?: string;
}

/**
 * Proverava da li korisnik ima aktivnu pretplatu.
 * Vraća pretplatu ili null.
 */
export async function getActiveSubscription(
  adminClient: SupabaseClient,
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await adminClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Subscription check failed: ${error.message}`);
  }

  return data as Subscription | null;
}

/**
 * Dohvata profil korisnika (credits, role, itd.).
 */
export async function getUserProfile(
  adminClient: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }

  return data as Profile | null;
}

/**
 * Kompletna provera kredita: pretplata + dovoljno kredita.
 */
export async function checkCredits(
  adminClient: SupabaseClient,
  userId: string,
  requiredCredits: number,
): Promise<CreditCheckResult> {
  const subscription = await getActiveSubscription(adminClient, userId);
  if (!subscription) {
    return {
      hasSubscription: false,
      hasEnoughCredits: false,
      currentCredits: 0,
      required: requiredCredits,
    };
  }

  const profile = await getUserProfile(adminClient, userId);
  if (!profile) {
    return {
      hasSubscription: true,
      hasEnoughCredits: false,
      currentCredits: 0,
      required: requiredCredits,
      subscriptionStatus: subscription.status,
    };
  }

  return {
    hasSubscription: true,
    hasEnoughCredits: profile.credits >= requiredCredits,
    currentCredits: profile.credits,
    required: requiredCredits,
    subscriptionStatus: subscription.status,
  };
}

/**
 * Atomski oduzima kredite pozivom RPC funkcije `deduct_credits`.
 * Vraća `true` ako je uspešno, `false` ako nema dovoljno kredita.
 */
export async function deductCredits(
  adminClient: SupabaseClient,
  userId: string,
  amount: number,
  type: "text_gen" | "image_gen" | "video_gen",
  referenceId: string,
  description?: string,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_reference_id: referenceId,
    p_description: description ?? null,
  });

  if (error) {
    throw new Error(`Credit deduction failed: ${error.message}`);
  }

  return data === true;
}

/**
 * Vraća trenutno stanje kredita korisnika (posle oduzimanja).
 */
export async function getRemainingCredits(
  adminClient: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch remaining credits: ${error.message}`);
  }

  return data?.credits ?? 0;
}
