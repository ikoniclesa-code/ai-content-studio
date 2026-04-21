import { SupabaseClient } from "@supabase/supabase-js";

type GenerationAction = "text_gen" | "image_gen" | "video_gen";

const RATE_LIMITS: Record<GenerationAction, { maxRequests: number; windowMinutes: number }> = {
  text_gen: { maxRequests: 20, windowMinutes: 1 },
  image_gen: { maxRequests: 5, windowMinutes: 1 },
  video_gen: { maxRequests: 2, windowMinutes: 1 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Proverava i ažurira rate limit za korisnika.
 * Koristi rate_limits tabelu u bazi — svaki prozor traje `windowMinutes` minuta.
 *
 * Mora se pozivati sa admin (service role) klijentom jer RLS
 * na rate_limits dozvoljava samo service role pisanje.
 */
export async function checkRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  action: GenerationAction,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000,
  ).toISOString();

  // Izbriši stare zapise izvan prozora
  await adminClient
    .from("rate_limits")
    .delete()
    .eq("user_id", userId)
    .eq("action", action)
    .lt("window_start", windowStart);

  // Prebroj zahteve u trenutnom prozoru
  const { count, error } = await adminClient
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("window_start", windowStart);

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const currentCount = count ?? 0;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000);

  if (currentCount >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Zabeleži novi zahtev
  const { error: insertError } = await adminClient.from("rate_limits").insert({
    user_id: userId,
    action,
    window_start: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(`Rate limit insert failed: ${insertError.message}`);
  }

  return { allowed: true, remaining: remaining - 1, resetAt };
}
