// Input validation helpers

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const HANDLE_REGEX = /^[a-zA-Z0-9_]{1,30}$/;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle);
}

/**
 * Sanitize a string for safe storage/display.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Clamp a number within a range.
 */
export function clampInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultVal));
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(parsed, max));
}
