// ─── Stripe Price ID-ovi ────────────────────────────────────────────────────
// UNESITE VAŠE STRIPE PRICE ID-ove OVDE nakon kreiranja proizvoda u Stripe Dashboard-u.
// Format: price_XXXXXXXXXXXXXXXXXXXXXXXX
export const STRIPE_PRICE_IDS = {
  starter_monthly: "price_1TLuJjI6ZkiVynlub7HuevqK",
  starter_yearly: "price_1TLuJjI6ZkiVynluxVkIHjDb",
  pro_monthly: "price_1TLuLbI6ZkiVynlue0eAXKRn",
  pro_yearly: "price_1TLuN0I6ZkiVynluPOtoXCHL",
} as const;

export type StripePriceId = (typeof STRIPE_PRICE_IDS)[keyof typeof STRIPE_PRICE_IDS];

// ─── Mapiranje Price ID → Plan info ────────────────────────────────────────
export interface PlanConfig {
  planName: "starter" | "pro";
  billingPeriod: "monthly" | "yearly";
  creditsPerMonth: number;
  label: string;
}

export const PRICE_TO_PLAN: Record<string, PlanConfig> = {
  [STRIPE_PRICE_IDS.starter_monthly]: {
    planName: "starter",
    billingPeriod: "monthly",
    creditsPerMonth: 1000,
    label: "Starter (mesečno)",
  },
  [STRIPE_PRICE_IDS.starter_yearly]: {
    planName: "starter",
    billingPeriod: "yearly",
    creditsPerMonth: 1000,
    label: "Starter (godišnje)",
  },
  [STRIPE_PRICE_IDS.pro_monthly]: {
    planName: "pro",
    billingPeriod: "monthly",
    creditsPerMonth: 2800,
    label: "Pro (mesečno)",
  },
  [STRIPE_PRICE_IDS.pro_yearly]: {
    planName: "pro",
    billingPeriod: "yearly",
    creditsPerMonth: 2800,
    label: "Pro (godišnje)",
  },
};

// ─── Planovi — cene i opisi ────────────────────────────────────────────────
export const PLANS = {
  starter: {
    monthlyUsd: 19.99,
    yearlyUsd: 191.9,
    yearlyMonthlyUsd: 15.99,
    creditsPerMonth: 1000,
    description: "Za male biznise",
    features: [
      "1.000 kredita mesečno",
      "Generisanje teksta (1 kredit)",
      "Generisanje slika (14 kredita)",
      "Generisanje videa (60 kredita)",
      "Istorija generacija",
      "Email podrška",
    ],
  },
  pro: {
    monthlyUsd: 49.99,
    yearlyUsd: 479.9,
    yearlyMonthlyUsd: 39.99,
    creditsPerMonth: 2800,
    description: "Za aktivne korisnike",
    features: [
      "2.800 kredita mesečno",
      "Generisanje teksta (1 kredit)",
      "Generisanje slika (14 kredita)",
      "Generisanje videa (60 kredita)",
      "Prioritetna obrada",
      "Istorija generacija",
      "Prioritetna podrška",
    ],
  },
} as const;

export const CREDIT_COSTS = {
  text: 1,
  image: 14,
  video: 60,
} as const;
