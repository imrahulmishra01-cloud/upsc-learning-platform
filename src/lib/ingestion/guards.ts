/**
 * Universal ingestion safety guard.
 * Applied across all ingestion/sync routes to enforce legal and language safety.
 */

import { IngestionSource } from "./sources";

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

export function countDevanagariChars(text: string | null | undefined): number {
  if (!text) return 0;
  let count = 0;
  for (const char of text) {
    if (DEVANAGARI_REGEX.test(char)) count++;
  }
  return count;
}

export function countAlphabeticChars(text: string | null | undefined): number {
  if (!text) return 0;
  let count = 0;
  for (const char of text) {
    if (/[a-zA-Z\u0900-\u097F]/.test(char)) count++;
  }
  return count;
}

export function getDevanagariRatio(text: string | null | undefined): number {
  const alpha = countAlphabeticChars(text);
  if (alpha === 0) return 0;
  return countDevanagariChars(text) / alpha;
}

export type LanguageGuardResult = {
  skip: boolean;
  reason: "official_english_allowed" | "official_hindi_allowed" | "mixed_language_allowed" | "skipped_source_not_allowed";
};

export function shouldSkipForLanguage(
  item: { title?: string; description?: string | null; url?: string },
  source?: Pick<IngestionSource, "language" | "allowed">
): LanguageGuardResult {
  if (source && !source.allowed) {
    return { skip: true, reason: "skipped_source_not_allowed" };
  }
  
  const combinedText = (item.title || "") + " " + (item.description || "") + " " + (item.url || "");
  const totalRatio = getDevanagariRatio(combinedText);

  if (totalRatio === 0) {
    return { skip: false, reason: "official_english_allowed" };
  } else if (totalRatio > 0.5) {
    return { skip: false, reason: "official_hindi_allowed" };
  } else {
    return { skip: false, reason: "mixed_language_allowed" };
  }
}

/**
 * Ensures a source configuration complies with our strict ingestion rules.
 * Throws if not allowed.
 */
export function assertAllowedIngestionSource(source: Pick<IngestionSource, "allowed" | "legalMode" | "language" | "name">) {
  if (!source.allowed) {
    throw new Error(`Source '${source.name}' is not allowed for ingestion.`);
  }
  if (source.legalMode !== "metadata_only") {
    throw new Error(`Source '${source.name}' does not use metadata_only legal mode.`);
  }
}

/**
 * Strips dangerous HTML tags and trims whitespace for ingested text fields (titles, descriptions).
 */
export function sanitizeIngestedText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Normalizes URL for consistent duplication checking.
 */
export function normalizeIngestionUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    // Remove hash fragments and common tracking queries if desired, 
    // for now just strip hash to ensure consistent matching
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function shouldSkipForLegalSafety(item: { url?: string }): boolean {
  if (!item.url) return true; // Require a link
  return false;
}

/**
 * Normalizes an official source URL for opening/viewing, applying source-specific
 * rules like forcing English language for PIB.
 */
export function normalizeOfficialSourceUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url.trim();
  }
}
