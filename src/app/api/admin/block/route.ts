import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const blockSchema = z.object({
  userId: z.string().uuid(),
  blocked: z.boolean(),
  reason: z.string().min(3, "Razlog mora imati najmanje 3 karaktera.").max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { admin, adminClient, ip } = ctx;

    const body = await request.json();
    const validation = blockSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Neispravan unos." },
        { status: 400 },
      );
    }

    const { userId, blocked, reason } = validation.data;

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Ne možete blokirati sami sebe." },
        { status: 400 },
      );
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, email, role")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen." },
        { status: 404 },
      );
    }

    if (targetProfile.role === "admin") {
      return NextResponse.json(
        { error: "Ne možete blokirati drugog admina." },
        { status: 400 },
      );
    }

    const { error } = await adminClient
      .from("profiles")
      .update({ is_blocked: blocked, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: "Greška pri ažuriranju korisnika." },
        { status: 500 },
      );
    }

    const action = blocked ? "block_user" : "unblock_user";
    await logAdminAction(adminClient, admin.id, action, userId, {
      target_email: targetProfile.email,
      reason: reason ?? null,
    }, ip);

    return NextResponse.json({
      success: true,
      message: blocked
        ? `Korisnik ${targetProfile.email} je blokiran.`
        : `Korisnik ${targetProfile.email} je odblokiran.`,
    });
  } catch (error) {
    console.error("[/api/admin/block]", error);
    return NextResponse.json(
      { error: "Greška pri blokiranju korisnika." },
      { status: 500 },
    );
  }
}
