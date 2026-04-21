import { z } from "zod";

// ─── Auth validacije ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Unesite važeću email adresu"),
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Ime mora imati najmanje 2 karaktera")
      .max(100, "Ime je predugo"),
    email: z.string().email("Unesite važeću email adresu"),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Lozinke se ne podudaraju",
    path: ["confirm_password"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Unesite važeću email adresu"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Lozinke se ne podudaraju",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

// ─── Generation validacije ──────────────────────────────────────────────────

const SUPPORTED_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "tiktok",
] as const;

const SUPPORTED_TONES = [
  "profesionalni",
  "opusten",
  "humorican",
  "informativan",
  "inspirativan",
] as const;

const SUPPORTED_LANGUAGES = ["sr", "hr", "en"] as const;

const SUPPORTED_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:5"] as const;

const SUPPORTED_STYLES = [
  "fotografija",
  "ilustracija",
  "minimalisticki",
  "3d",
  "akvarel",
] as const;

const MAX_PROMPT_LENGTH = 2000;
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB

const base64ImageField = z
  .string()
  .max(MAX_BASE64_SIZE, "Slika je prevelika (max 10MB)")
  .refine(
    (val) =>
      /^data:image\/(png|jpeg|jpg|webp);base64,/.test(val.slice(0, 50)),
    "Neispravan format slike. Dozvoljeni: PNG, JPEG, WebP",
  )
  .optional();

export const generateTextSchema = z
  .object({
    prompt_text: z
      .string()
      .max(MAX_PROMPT_LENGTH, `Prompt ne sme biti duži od ${MAX_PROMPT_LENGTH} karaktera`)
      .optional(),
    prompt_image: base64ImageField,
    brand_id: z.string().uuid("Neispravan ID brenda"),
    category: z
      .string()
      .min(1, "Kategorija je obavezna")
      .optional(),
    platform: z.enum(SUPPORTED_PLATFORMS).optional(),
    tone: z.enum(SUPPORTED_TONES).optional(),
    language: z.enum(SUPPORTED_LANGUAGES, {
      error: "Neispravan jezik. Dozvoljeni: sr, hr, en",
    }),
  })
  .refine((data) => data.prompt_text || data.prompt_image, {
    message: "Potreban je barem prompt tekst ili slika",
    path: ["prompt_text"],
  });

export const generateImageSchema = z.object({
  prompt_text: z
    .string()
    .min(1, "Opis slike je obavezan")
    .max(MAX_PROMPT_LENGTH, `Prompt ne sme biti duži od ${MAX_PROMPT_LENGTH} karaktera`),
  reference_image: base64ImageField,
  brand_id: z.string().uuid("Neispravan ID brenda"),
  aspect_ratio: z.enum(SUPPORTED_ASPECT_RATIOS).optional(),
  style: z.enum(SUPPORTED_STYLES).optional(),
});

export const generateVideoSchema = z.object({
  prompt_text: z
    .string()
    .min(1, "Opis videa je obavezan")
    .max(MAX_PROMPT_LENGTH, `Prompt ne sme biti duži od ${MAX_PROMPT_LENGTH} karaktera`),
  reference_image: base64ImageField,
  brand_id: z.string().uuid("Neispravan ID brenda"),
  duration: z.number().min(5).max(15).optional(),
  aspect_ratio: z.enum(SUPPORTED_ASPECT_RATIOS).optional(),
});

export type GenerateTextInput = z.infer<typeof generateTextSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;
