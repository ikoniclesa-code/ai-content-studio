export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: "user" | "admin";
  avatar_url: string | null;
  language: "sr" | "hr" | "en";
  theme: "light" | "dark";
  onboarding_completed: boolean;
  credits: number;
  stripe_customer_id: string | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  company_logo_url: string | null;
  tagline: string | null;
  categories: string[];
  is_default: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_name: "starter" | "pro";
  billing_period: "monthly" | "yearly" | null;
  status: "active" | "canceled" | "past_due" | "trialing";
  credits_per_period: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type:
    | "subscription_credit"
    | "text_gen"
    | "image_gen"
    | "video_gen"
    | "admin_adjustment";
  description: string | null;
  reference_id: string | null;
  balance_after: number | null;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  brand_id: string | null;
  type: "text" | "image" | "video";
  prompt_text: string | null;
  prompt_image_url: string | null;
  result_text: string | null;
  result_image_url: string | null;
  result_video_url: string | null;
  credits_used: number;
  ai_model: string | null;
  ai_tokens_used: number | null;
  status: "pending" | "completed" | "failed";
  error_message: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface RateLimit {
  id: string;
  user_id: string;
  action: "text_gen" | "image_gen" | "video_gen";
  window_start: string;
  count: number;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Json | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Json | null;
  ip_address: string | null;
  created_at: string;
}
