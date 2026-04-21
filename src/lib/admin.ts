import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

export interface AdminContext {
  admin: Profile;
  adminClient: SupabaseClient;
  ip: string;
}

export async function requireAdmin(
  request: NextRequest,
): Promise<AdminContext | NextResponse> {
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

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Nemate pristup admin panelu." },
      { status: 403 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return {
    admin: profile as Profile,
    adminClient,
    ip,
  };
}

export async function logAdminAction(
  adminClient: SupabaseClient,
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string,
) {
  await adminClient.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
    ip_address: ipAddress,
  });
}
