import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateImageSchema } from "@/lib/validations";
import { checkCredits, deductCredits, getRemainingCredits } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sanitizePrompt } from "@/lib/utils";
import { buildImagePrompt } from "@/lib/ai/prompts";
import { generateImage } from "@/lib/ai/image-generator";
import { CREDIT_COSTS } from "@/constants/plans";
import type { GenerationErrorResponse, GenerationSuccessResponse } from "@/types/api";
import type { Brand } from "@/types/database";

export const maxDuration = 120;

const CREDIT_COST = CREDIT_COSTS.image; // 14
const MAX_BODY_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(request: NextRequest) {
  try {
    // ── 1. Proveri auth ──────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Niste prijavljeni.", code: "UNAUTHORIZED" } satisfies GenerationErrorResponse,
        { status: 401 },
      );
    }

    const adminClient = createAdminClient();

    // ── 2. Proveri pretplatu ─────────────────────────────────────────────
    // ── 3. Proveri kredite ───────────────────────────────────────────────
    const creditCheck = await checkCredits(adminClient, user.id, CREDIT_COST);

    if (!creditCheck.hasSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: "Nemate aktivnu pretplatu. Izaberite plan da biste koristili generisanje.",
          code: "NO_SUBSCRIPTION",
        } satisfies GenerationErrorResponse,
        { status: 403 },
      );
    }

    if (!creditCheck.hasEnoughCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Nemate dovoljno kredita. Potrebno: ${CREDIT_COST}, raspoloživo: ${creditCheck.currentCredits}.`,
          code: "INSUFFICIENT_CREDITS",
        } satisfies GenerationErrorResponse,
        { status: 403 },
      );
    }

    // ── 4. Proveri rate limit ────────────────────────────────────────────
    const rateLimit = await checkRateLimit(adminClient, user.id, "image_gen");

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Previše zahteva. Sačekajte minut pre nego što pokušate ponovo.",
          code: "RATE_LIMITED",
        } satisfies GenerationErrorResponse,
        { status: 429 },
      );
    }

    // ── 5. Validiraj input ───────────────────────────────────────────────
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Zahtev je prevelik (max 15MB).", code: "VALIDATION_ERROR" } satisfies GenerationErrorResponse,
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Neispravan JSON format.", code: "VALIDATION_ERROR" } satisfies GenerationErrorResponse,
        { status: 400 },
      );
    }

    const validation = generateImageSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? "Neispravan unos";
      return NextResponse.json(
        { success: false, error: firstError, code: "VALIDATION_ERROR" } satisfies GenerationErrorResponse,
        { status: 400 },
      );
    }

    const input = validation.data;

    // ── 6. Sanitizuj input ───────────────────────────────────────────────
    const cleanPrompt = sanitizePrompt(input.prompt_text);

    // ── Dohvati brend ────────────────────────────────────────────────────
    const { data: brand, error: brandError } = await adminClient
      .from("brands")
      .select("*")
      .eq("id", input.brand_id)
      .eq("user_id", user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { success: false, error: "Brend nije pronađen.", code: "VALIDATION_ERROR" } satisfies GenerationErrorResponse,
        { status: 404 },
      );
    }

    const typedBrand = brand as Brand;

    // ── 7. Pozovi AI sa retry (3 pokušaja) ───────────────────────────────
    const fullPrompt = buildImagePrompt({
      brand: typedBrand,
      userPrompt: cleanPrompt,
      aspectRatio: input.aspect_ratio,
      style: input.style,
    });

    let aiResult;
    try {
      aiResult = await generateImage(fullPrompt, input.reference_image);
    } catch (aiError) {
      await adminClient.from("generations").insert({
        user_id: user.id,
        brand_id: input.brand_id,
        type: "image",
        prompt_text: cleanPrompt,
        credits_used: 0,
        ai_model: "gemini-3.1-pro-preview",
        status: "failed",
        error_message:
          aiError instanceof Error ? aiError.message : "Nepoznata greška",
        metadata: {
          aspect_ratio: input.aspect_ratio,
          style: input.style,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "AI servis je trenutno nedostupan. Pokušajte ponovo za nekoliko minuta. Krediti NISU oduzeti.",
          code: "AI_SERVICE_ERROR",
        } satisfies GenerationErrorResponse,
        { status: 503 },
      );
    }

    // ── Sačuvaj sliku u Supabase Storage ─────────────────────────────────
    const fileName = `${user.id}/${Date.now()}.png`;
    const imageBuffer = Buffer.from(aiResult.imageBase64, "base64");

    const { error: uploadError } = await adminClient.storage
      .from("generations")
      .upload(fileName, imageBuffer, {
        contentType: aiResult.mimeType,
        upsert: false,
      });

    let imageUrl: string | null = null;
    if (!uploadError) {
      const { data: urlData } = adminClient.storage
        .from("generations")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    // ── 8. Sačuvaj rezultat ──────────────────────────────────────────────
    const { data: generation, error: genError } = await adminClient
      .from("generations")
      .insert({
        user_id: user.id,
        brand_id: input.brand_id,
        type: "image",
        prompt_text: cleanPrompt,
        result_image_url: imageUrl,
        credits_used: CREDIT_COST,
        ai_model: "gemini-3.1-pro-preview",
        status: "completed",
        metadata: {
          aspect_ratio: input.aspect_ratio,
          style: input.style,
          mime_type: aiResult.mimeType,
        },
      })
      .select("id")
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        {
          success: false,
          error: "Greška pri čuvanju rezultata. Krediti NISU oduzeti.",
          code: "INTERNAL_ERROR",
        } satisfies GenerationErrorResponse,
        { status: 500 },
      );
    }

    // ── 9. Oduzmi kredite atomski ────────────────────────────────────────
    const deducted = await deductCredits(
      adminClient,
      user.id,
      CREDIT_COST,
      "image_gen",
      generation.id,
      `Generisanje slike: ${typedBrand.name}`,
    );

    if (!deducted) {
      await adminClient.from("generations").delete().eq("id", generation.id);
      if (imageUrl) {
        await adminClient.storage.from("generations").remove([fileName]);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Nemate dovoljno kredita. Potrebno: ${CREDIT_COST}.`,
          code: "INSUFFICIENT_CREDITS",
        } satisfies GenerationErrorResponse,
        { status: 403 },
      );
    }

    // ── 10. Vrati rezultat ───────────────────────────────────────────────
    const creditsRemaining = await getRemainingCredits(adminClient, user.id);

    return NextResponse.json(
      {
        success: true,
        generation_id: generation.id,
        type: "image",
        result_image_url: imageUrl ?? undefined,
        credits_used: CREDIT_COST,
        credits_remaining: creditsRemaining,
      } satisfies GenerationSuccessResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/generate/image] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Došlo je do neočekivane greške. Pokušajte ponovo.",
        code: "INTERNAL_ERROR",
      } satisfies GenerationErrorResponse,
      { status: 500 },
    );
  }
}
