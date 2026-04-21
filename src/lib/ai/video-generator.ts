import { withRetry } from "@/lib/utils";

const MODEL = "veo-3.1-lite-generate-preview";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 60; // 5 min max

export interface VideoGenerationResult {
  videoBase64: string;
  mimeType: string;
}

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }
  return apiKey;
}

/**
 * Generiše video koristeći Veo-3.1-lite-generate-preview putem Google AI REST API-ja.
 *
 * Veo modeli koriste asinhroni tok: šalje se zahtev, dobija se operacija,
 * zatim se poll-uje dok ne bude gotov.
 *
 * Retry: 3 pokušaja za inicijalni zahtev, polling je zasebno.
 */
export async function generateVideo(
  prompt: string,
  referenceImageBase64?: string,
): Promise<VideoGenerationResult> {
  const apiKey = getApiKey();

  const operationName = await withRetry(async () => {
    return await startVideoGeneration(apiKey, prompt, referenceImageBase64);
  }, 3, 2000);

  const result = await pollForResult(apiKey, operationName);
  return result;
}

async function startVideoGeneration(
  apiKey: string,
  prompt: string,
  referenceImageBase64?: string,
): Promise<string> {
  const contents: Array<Record<string, unknown>> = [];

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (referenceImageBase64) {
    const match = referenceImageBase64.match(
      /^data:(image\/\w+);base64,(.+)$/,
    );
    if (match) {
      parts.push({
        inline_data: { mime_type: match[1], data: match[2] },
      });
    }
  }

  contents.push({ role: "user", parts });

  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        responseMimeType: "video/mp4",
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Veo-3.1-lite-generate-preview API error (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();

  // Veo može vratiti direktan rezultat ili operaciju za polling
  if (data.candidates?.[0]?.content?.parts) {
    // Direktan rezultat (baca se u pollForResult format)
    return `__DIRECT__${JSON.stringify(data)}`;
  }

  if (data.name) {
    return data.name;
  }

  throw new Error("Veo-3.1-lite-generate-preview: Neočekivan format odgovora");
}

async function pollForResult(
  apiKey: string,
  operationName: string,
): Promise<VideoGenerationResult> {
  // Direktan rezultat (bez pollinga)
  if (operationName.startsWith("__DIRECT__")) {
    const data = JSON.parse(operationName.slice(10));
    return extractVideoFromResponse(data);
  }

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const url = `${API_BASE}/operations/${operationName}?key=${apiKey}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Veo poll error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    if (data.done) {
      if (data.error) {
        throw new Error(
          `Veo-3.1-lite-generate-preview generisanje neuspešno: ${data.error.message}`,
        );
      }
      return extractVideoFromResponse(data.response ?? data);
    }
  }

  throw new Error(
    "Veo-3.1-lite-generate-preview: Generisanje videa traje predugo. Pokušajte ponovo.",
  );
}

function extractVideoFromResponse(data: Record<string, unknown>): VideoGenerationResult {
  const candidates = (data as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }> }).candidates;
  if (!candidates?.[0]?.content?.parts) {
    throw new Error("Veo-3.1-lite-generate-preview: Odgovor ne sadrži video");
  }

  for (const part of candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        videoBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "video/mp4",
      };
    }
  }

  throw new Error("Veo-3.1-lite-generate-preview: Odgovor ne sadrži video podatke");
}
