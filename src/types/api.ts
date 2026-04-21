export interface GenerateTextRequest {
  prompt_text?: string;
  prompt_image?: string; // base64
  brand_id: string;
  category: string;
  platform?: string;
  tone?: string;
  language: string;
}

export interface GenerateImageRequest {
  prompt_text: string;
  reference_image?: string; // base64
  brand_id: string;
  aspect_ratio?: string;
  style?: string;
}

export interface GenerateVideoRequest {
  prompt_text: string;
  reference_image?: string; // base64
  brand_id: string;
  duration?: number;
  aspect_ratio?: string;
}

export interface GenerationSuccessResponse {
  success: true;
  generation_id: string;
  type: "text" | "image" | "video";
  result_text?: string;
  result_image_url?: string;
  result_video_url?: string;
  credits_used: number;
  credits_remaining: number;
}

export interface GenerationErrorResponse {
  success: false;
  error: string;
  code:
    | "UNAUTHORIZED"
    | "NO_SUBSCRIPTION"
    | "INSUFFICIENT_CREDITS"
    | "RATE_LIMITED"
    | "VALIDATION_ERROR"
    | "AI_SERVICE_ERROR"
    | "INTERNAL_ERROR";
}

export type GenerationResponse =
  | GenerationSuccessResponse
  | GenerationErrorResponse;
