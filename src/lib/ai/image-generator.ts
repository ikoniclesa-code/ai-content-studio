import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "@/lib/utils";

const MODEL = "gemini-3.1-pro-preview";
const TIMEOUT_MS = 90_000;

export interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
}

function getGoogleAIClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generiše sliku koristeći Gemini-3.1-pro-preview.
 *
 * Šalje tekstualni prompt (i opciono referentnu sliku)
 * i vraća generisanu sliku kao base64.
 * Retry: 2 pokušaja sa eksponencijalnim back-off-om.
 */
export async function generateImage(
  prompt: string,
  referenceImageBase64?: string,
): Promise<ImageGenerationResult> {
  const genAI = getGoogleAIClient();

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseModalities: ["IMAGE"],
    } as Record<string, unknown>,
  });

  const result = await withRetry(async () => {
    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [{ text: prompt }];

    if (referenceImageBase64) {
      const match = referenceImageBase64.match(
        /^data:(image\/\w+);base64,(.+)$/,
      );
      if (match) {
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] },
        });
      }
    }

    const response = await model.generateContent(parts, {
      timeout: TIMEOUT_MS,
    });

    const candidate = response.response.candidates?.[0];
    if (!candidate?.content?.parts?.length) {
      throw new Error("Gemini-3.1-pro-preview nije vratio rezultat");
    }

    for (const part of candidate.content.parts) {
      if ("inlineData" in part && part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }

    throw new Error("Gemini-3.1-pro-preview odgovor ne sadrži sliku");
  }, 2, 3000);

  return result;
}
