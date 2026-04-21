import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { z } from "zod";

const creditSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((v) => v !== 0, "Iznos ne može biti 0."),
  reason: z
    .string()
    .min(3, "Razlog mora imati najmanje 3 karaktera.")
    .max(500),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request);
    if (ctx instanceof NextResponse) return ctx;
    const { admin, adminClient, ip } = ctx;

    const body = await request.json();
    const validation = creditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Neispravan unos." },
        { status: 400 },
      );
    }

    const { userId, amount, reason } = validation.data;

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, credits, email")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen." },
        { status: 404 },
      );
    }

    if (amount > 0) {
      const { data: newBalance, error } = await adminClient.rpc("add_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_type: "admin_adjustment",
        p_description: `Admin: ${reason}`,
      });

      if (error) {
        return NextResponse.json(
          { error: "Greška pri dodavanju kredita." },
          { status: 500 },
        );
      }

      await logAdminAction(adminClient, admin.id, "credit_adjustment", userId, {
        amount,
        reason,
        previous_credits: targetProfile.credits,
        new_balance: newBalance,
      }, ip);

      return NextResponse.json({
        success: true,
        newBalance,
        message: `Dodato ${amount} kredita korisniku ${targetProfile.email}.`,
      });
    } else {
      const absAmount = Math.abs(amount);
      if (targetProfile.credits < absAmount) {
        return NextResponse.json(
          {
            error: `Korisnik ima samo ${targetProfile.credits} kredita. Ne možete oduzeti ${absAmount}.`,
          },
          { status: 400 },
        );
      }

      const { data: deducted, error } = await adminClient.rpc(
        "deduct_credits",
        {
          p_user_id: userId,
          p_amount: absAmount,
          p_type: "admin_adjustment",
          p_reference_id: null,
          p_description: `Admin: ${reason}`,
        },
      );

      if (error || !deducted) {
        return NextResponse.json(
          { error: "Greška pri oduzimanju kredita." },
          { status: 500 },
        );
      }

      const { data: updatedProfile } = await adminClient
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      await logAdminAction(adminClient, admin.id, "credit_adjustment", userId, {
        amount,
        reason,
        previous_credits: targetProfile.credits,
        new_balance: updatedProfile?.credits ?? 0,
      }, ip);

      return NextResponse.json({
        success: true,
        newBalance: updatedProfile?.credits ?? 0,
        message: `Oduzeto ${absAmount} kredita korisniku ${targetProfile.email}.`,
      });
    }
  } catch (error) {
    console.error("[/api/admin/credits]", error);
    return NextResponse.json(
      { error: "Greška pri podešavanju kredita." },
      { status: 500 },
    );
  }
}
