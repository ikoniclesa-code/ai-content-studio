import type { Brand } from "@/types/database";

interface TextPromptParams {
  brand: Brand;
  category?: string;
  platform?: string;
  language: string;
  tone?: string;
  userPrompt?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  sr: "srpskom",
  hr: "hrvatskom",
  en: "engleskom",
};

const DEFAULT_TONE = "profesionalni";
const DEFAULT_PLATFORM = "društvenu mrežu";

/**
 * System prompt za GPT-5.4 generisanje tekstualnog sadržaja.
 */
export function buildTextSystemPrompt(params: TextPromptParams): string {
  const lang = LANGUAGE_MAP[params.language] ?? "srpskom";
  const platform = params.platform ?? DEFAULT_PLATFORM;
  const tone = params.tone ?? DEFAULT_TONE;
  const tagline = params.brand.tagline
    ? `i poznat je po: "${params.brand.tagline}"`
    : "";

  const categoryLine = params.category
    ? `Korisnik posluje u oblasti "${params.category}".`
    : "";

  return [
    `Ti si ekspert za kreiranje sadržaja za društvene mreže.`,
    categoryLine,
    `Brend se zove "${params.brand.name}" ${tagline}.`,
    `Napravi privlačnu objavu za ${platform} na ${lang} jeziku.`,
    `Ton treba da bude ${tone}.`,
    `Objava treba da bude optimizovana za engagement na društvenoj mreži — uključi relevantne hashtag-ove.`,
    `Ne objašnjavaj šta radiš, samo vrati gotov tekst objave.`,
  ].join(" ");
}

interface ImagePromptParams {
  brand: Brand;
  userPrompt: string;
  aspectRatio?: string;
  style?: string;
}

/**
 * System prompt za Gemini-3.1-pro-preview generisanje slika.
 */
export function buildImagePrompt(params: ImagePromptParams): string {
  const parts: string[] = [
    `Generiši visokokvalitetnu sliku za brend "${params.brand.name}".`,
  ];

  if (params.brand.tagline) {
    parts.push(`Brend je poznat po: "${params.brand.tagline}".`);
  }

  if (params.style) {
    parts.push(`Stil slike: ${params.style}.`);
  }

  if (params.aspectRatio) {
    parts.push(`Format: ${params.aspectRatio}.`);
  }

  parts.push(`Opis: ${params.userPrompt}`);

  return parts.join(" ");
}

interface VideoPromptParams {
  brand: Brand;
  userPrompt: string;
  duration?: number;
  aspectRatio?: string;
}

/**
 * Prompt za Veo-3.1-lite-generate-preview generisanje videa.
 */
export function buildVideoPrompt(params: VideoPromptParams): string {
  const parts: string[] = [
    `Generiši kratak promotivni video za brend "${params.brand.name}".`,
  ];

  if (params.brand.tagline) {
    parts.push(`Brend slogan: "${params.brand.tagline}".`);
  }

  if (params.duration) {
    parts.push(`Trajanje: ${params.duration} sekundi.`);
  }

  if (params.aspectRatio) {
    parts.push(`Format: ${params.aspectRatio}.`);
  }

  parts.push(`Opis: ${params.userPrompt}`);

  return parts.join(" ");
}
