import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const impersonateSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { admin, adminClient, ip } = ctx;

    const body = await request.json();
    const validation = impersonateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Neispravan ID korisnika." },
        { status: 400 },
      );
    }

    const { userId } = validation.data;

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Ne možete se ulogovati kao sami sebe." },
        { status: 400 },
      );
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen." },
        { status: 404 },
      );
    }

    await logAdminAction(adminClient, admin.id, "impersonation", userId, {
      target_email: targetProfile.email,
      target_name: targetProfile.full_name,
    }, ip);

    return NextResponse.json({
      success: true,
      user: {
        id: targetProfile.id,
        email: targetProfile.email,
        full_name: targetProfile.full_name,
      },
      message: `Impersonacija korisnika ${targetProfile.email} je zabeležena. Koristite Supabase dashboard za generisanje login linka.`,
    });
  } catch (error) {
    console.error("[/api/admin/impersonate]", error);
    return NextResponse.json(
      { error: "Greška pri impersonaciji." },
      { status: 500 },
    );
  }
}
