/**
 * Sanitizuje korisnički unos — uklanja potencijalno opasan sadržaj
 * pre slanja AI servisima ili čuvanja u bazi.
 */
export function sanitizePrompt(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Sanitize general text input (names, brand names, etc.)
 * Escapes HTML entities and removes dangerous patterns.
 */
export function sanitizeTextInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/**
 * Validates that a file size doesn't exceed the maximum allowed bytes.
 */
export function isFileTooLarge(sizeBytes: number, maxMB: number = 10): boolean {
  return sizeBytes > maxMB * 1024 * 1024;
}

/**
 * Validates that a file type is an allowed image format.
 */
export function isAllowedImageType(mimeType: string): boolean {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  return allowed.includes(mimeType.toLowerCase());
}

/**
 * Ograničava dužinu stringa i dodaje "..." ako je skraćen.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Sleep helper za retry logiku.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generički retry wrapper sa eksponencijalnim back-off-om.
 * Pokušava `fn` do `maxAttempts` puta, čekajući `baseDelayMs * 2^(pokušaj-1)`.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 2000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
