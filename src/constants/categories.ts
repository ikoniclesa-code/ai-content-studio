/** Industrijske kategorije za onboarding / generisanje — proširiti po potrebi. */
export const INDUSTRY_CATEGORIES = [
  "marketing",
  "ecommerce",
  "education",
  "hospitality",
  "technology",
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];
