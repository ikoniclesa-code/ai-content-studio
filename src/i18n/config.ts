export const locales = ["sr", "hr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sr";
