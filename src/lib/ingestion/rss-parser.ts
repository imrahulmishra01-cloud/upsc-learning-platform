/**
 * RSS feed parser — server-side only, zero dependencies beyond native Node APIs.
 * Uses the native fetch() available in Next.js server runtime.
 *
 * Only parses: title, link, pubDate, description (first 500 chars max, stripped of HTML tags).
 * Never stores full article body.
 */

export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  /** Short description — HTML tags stripped, truncated to 500 chars */
  description: string | null;
  /** GUID or fallback to link — used for duplicate detection */
  guid: string;
}

/** Strip HTML tags from a string */
function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse a date string safely — returns ISO date string or null */
function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

/** Extract text content between two XML tags (first occurrence) */
function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA: <tag><![CDATA[...]]></tag>
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = re.exec(xml);
  if (match) return match[1].trim();

  // Self-closing or just value (for <guid> with no CDATA)
  const simpleRe = new RegExp(`<${tag}[^/]*?>([^<]+)<\\/${tag}>`, "i");
  const simple = simpleRe.exec(xml);
  return simple ? simple[1].trim() : null;
}

/** Parse raw RSS XML into an array of items (max 30) */
export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Split on <item>
  const parts = xml.split(/<item[\s>]/i);
  // Skip first element (feed header)
  for (let i = 1; i < parts.length && items.length < 30; i++) {
    const chunk = parts[i];
    const title = extractTag(chunk, "title") ?? "";
    const link = extractTag(chunk, "link") ?? "";
    const pubDate = parseDate(extractTag(chunk, "pubDate"));
    const rawDesc = extractTag(chunk, "description") ?? null;
    const description = rawDesc
      ? stripHtml(rawDesc).slice(0, 500) || null
      : null;
    const rawGuid = extractTag(chunk, "guid") ?? link;
    const guid = rawGuid || link;

    if (!title || !link) continue;

    items.push({ title: stripHtml(title), link, pubDate, description, guid });
  }

  return items;
}

/** Fetch + parse an RSS feed. Returns items or throws with a clear message. */
export async function fetchRssFeed(
  url: string,
  timeoutMs = 10_000
): Promise<RssItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "UPSC-StudyApp/1.0 (private educational tool)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    const text = await response.text();
    const lowerText = text.trim().toLowerCase();
    if (
      lowerText.startsWith("<!doctype html") ||
      lowerText.startsWith("<html") ||
      (!lowerText.includes("<rss") && !lowerText.includes("<feed"))
    ) {
      throw new Error("Source did not return RSS/XML");
    }
    return parseRss(text);
  } finally {
    clearTimeout(timer);
  }
}

export interface DebugResult {
  status: number;
  contentType: string | null;
  looksLikeXml: boolean;
  first300Chars: string;
  itemCount: number;
  sampleItems: { title: string; link: string }[];
  parseError: string | null;
  reasonZeroItems: string | null;
}

export async function debugRssFeed(url: string, timeoutMs = 10_000): Promise<DebugResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let status = 0;
  let contentType: string | null = null;
  let looksLikeXml = false;
  let first300Chars = "";
  let itemCount = 0;
  let sampleItems: { title: string; link: string }[] = [];
  let parseError: string | null = null;
  let reasonZeroItems: string | null = null;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "UPSC-StudyApp/1.0 (private educational tool)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 0 },
    });

    status = response.status;
    contentType = response.headers.get("content-type");

    const text = await response.text();
    const cleanText = text.trim();
    first300Chars = stripHtml(cleanText).slice(0, 300);
    
    const lowerText = cleanText.toLowerCase();
    looksLikeXml = !lowerText.startsWith("<!doctype html") && !lowerText.startsWith("<html") && (lowerText.includes("<rss") || lowerText.includes("<feed"));

    if (looksLikeXml) {
      try {
        const items = parseRss(text);
        itemCount = items.length;
        sampleItems = items.slice(0, 3).map(i => ({ title: i.title, link: i.link }));
        if (itemCount === 0) {
          if (!lowerText.includes("<item") && !lowerText.includes("<entry")) {
            reasonZeroItems = "No <item> or <entry> tags found in XML";
          } else {
            reasonZeroItems = "Found item tags, but failed to parse title or link from them";
          }
        }
      } catch (err) {
        parseError = err instanceof Error ? err.message : String(err);
      }
    } else {
      parseError = "Source did not return RSS/XML";
    }

  } catch (err) {
    parseError = err instanceof Error ? err.message : String(err);
  } finally {
    clearTimeout(timer);
  }

  return {
    status,
    contentType,
    looksLikeXml,
    first300Chars,
    itemCount,
    sampleItems,
    parseError,
    reasonZeroItems,
  };
}
