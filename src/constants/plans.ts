export const PLANS = {
  starter: {
    monthlyUsd: 19.99,
    yearlyUsd: 191.9,
    creditsPerMonth: 1000,
  },
  pro: {
    monthlyUsd: 49.99,
    yearlyUsd: 479.9,
    creditsPerMonth: 2800,
  },
} as const;

export const CREDIT_COSTS = {
  text: 1,
  image: 14,
  video: 60,
} as const;
