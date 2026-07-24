/**
 * Centralized private email allowlist helper.
 * Reads environment variables on the server-side (never exposed to the browser).
 *
 * Supports:
 * - APP_ALLOWED_EMAILS (comma-separated, recommended)
 * - APP_ALLOWED_EMAIL_1, APP_ALLOWED_EMAIL_2 (deprecated, supported for backward compatibility)
 */

/**
 * Parses and returns the list of normalized, deduplicated allowed email addresses.
 */
export function getAllowedEmails(): string[] {
  const rawList: string[] = [];

  // Primary: comma-separated list
  const primaryEnv = process.env.APP_ALLOWED_EMAILS;
  if (primaryEnv) {
    rawList.push(...primaryEnv.split(","));
  }

  // Deprecated legacy single-email variables (backward compatibility)
  if (process.env.APP_ALLOWED_EMAIL_1) {
    rawList.push(process.env.APP_ALLOWED_EMAIL_1);
  }
  if (process.env.APP_ALLOWED_EMAIL_2) {
    rawList.push(process.env.APP_ALLOWED_EMAIL_2);
  }

  const normalized = rawList
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes("@"));

  // Deduplicate
  return Array.from(new Set(normalized));
}

/**
 * Returns true if at least one valid email address is configured in the allowlist.
 */
export function hasConfiguredAllowlist(): boolean {
  return getAllowedEmails().length > 0;
}

/**
 * Returns true if the given email is present in the allowlist.
 * Fails closed (returns false) if email is empty or no allowlist is configured.
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedInput = email.trim().toLowerCase();
  if (!normalizedInput) return false;

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length === 0) return false;

  return allowedEmails.includes(normalizedInput);
}

/**
 * Returns the masked allowlist for display in the Settings UI.
 * e.g. "owner@example.com" → "o***@example.com"
 */
export function getMaskedAllowedEmails(): string[] {
  const emails = getAllowedEmails();
  return emails.map((email) => {
    const parts = email.split("@");
    if (parts.length !== 2 || !parts[0]) return "***";
    const [user, domain] = parts;
    return `${user[0]}***@${domain}`;
  });
}
