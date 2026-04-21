import OpenAI from "openai";
import { withRetry } from "@/lib/utils";

const MODEL = "gpt-5.4";
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 30_000;

export interface TextGenerationResult {
  text: string;
  tokensUsed: number;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

/**
 * Generiše tekst koristeći GPT-5.4.
 *
 * Podržava tekst prompt i/ili sliku (base64).
 * Retry: 3 pokušaja sa eksponencijalnim back-off-om (2s, 4s).
 */
export async function generateText(
  systemPrompt: string,
  userPrompt?: string,
  imageBase64?: string,
): Promise<TextGenerationResult> {
  const openai = getOpenAIClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64 && userPrompt) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageBase64 } },
      ],
    });
  } else if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: "Kreiraj objavu na osnovu ove slike.",
        },
        { type: "image_url", image_url: { url: imageBase64 } },
      ],
    });
  } else if (userPrompt) {
    messages.push({ role: "user", content: userPrompt });
  }

  const result = await withRetry(async () => {
    const completion = await openai.chat.completions.create(
      {
        model: MODEL,
        messages,
        max_completion_tokens: MAX_TOKENS,
        temperature: 0.8,
      },
      { timeout: TIMEOUT_MS },
    );

    const content = completion.choices[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      throw new Error("AI je vratio prazan odgovor");
    }

    return {
      text: content.trim(),
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }, 3, 2000);

  return result;
}
