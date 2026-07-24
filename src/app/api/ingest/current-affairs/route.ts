import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { OFFICIAL_SOURCES, getSourceById } from "@/lib/ingestion/sources";
import { fetchRssFeed, debugRssFeed } from "@/lib/ingestion/rss-parser";
import { 
  assertAllowedIngestionSource, 
  shouldSkipForLanguage, 
  shouldSkipForLegalSafety,
  sanitizeIngestedText,
  normalizeIngestionUrl,
  normalizeOfficialSourceUrl
} from "@/lib/ingestion/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/ingest/current-affairs ──────────────────────────────────────────
// Returns the list of available official sources.
export async function GET() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    sources: OFFICIAL_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      region: s.region,
      suggestedGsPapers: s.suggestedGsPapers,
      topicHint: s.topicHint ?? null,
      fetchMode: s.fetchMode,
      enabledForAutoFetch: s.enabledForAutoFetch,
      allowed: s.allowed,
      language: s.language,
      statusMessage: s.statusMessage,
    })),
  });
}

// ── POST /api/ingest/current-affairs ─────────────────────────────────────────
// Body: { sourceId: string, visibility?: "private" | "shared_between_two" }
// Fetches from allowlisted source, deduplicates against DB, inserts new items.
export async function POST(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: { sourceId?: string; visibility?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sourceId, visibility = "private", mode } = body;

  if (!sourceId || typeof sourceId !== "string") {
    return NextResponse.json({ error: "sourceId is required." }, { status: 400 });
  }

  const source = getSourceById(sourceId);
  if (!source) {
    return NextResponse.json(
      { error: `Source '${sourceId}' is not in the official source allowlist.` },
      { status: 400 }
    );
  }

  try {
    assertAllowedIngestionSource(source);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!source.enabledForAutoFetch || (source.fetchMode !== "rss" && source.fetchMode !== "discovery")) {
    return NextResponse.json(
      { error: `Source '${source.name}' is not enabled for auto-fetching or is manual-link only.` },
      { status: 400 }
    );
  }

  if (mode === "debug") {
    try {
      const debugInfo = await debugRssFeed(source.feedUrl);
      
      if (source.fetchMode === "discovery") {
        // Augment debugInfo for discovery mode
        const discoverySamples = [];

        for (let i = 0; i < debugInfo.sampleItems.length; i++) {
          const rawUrl = normalizeIngestionUrl(debugInfo.sampleItems[i].link);
          const normalized = normalizeOfficialSourceUrl(rawUrl);
          discoverySamples.push({ raw: debugInfo.sampleItems[i].link, normalized });
        }
        
        return NextResponse.json({ 
          debugInfo: {
            ...debugInfo,
            sourceId: source.id,
            fetchMode: source.fetchMode,
            discoveryUrl: source.feedUrl,
            displayUrl: source.displayUrl,
            discoveryMode: true,
            discoverySamples,
          } 
        });
      }

      return NextResponse.json({ 
        debugInfo: {
          ...debugInfo,
          sourceId: source.id,
          fetchMode: source.fetchMode,
          discoveryUrl: source.feedUrl,
          displayUrl: source.displayUrl,
        }
      });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  // Validate visibility
  const safeVisibility = visibility === "shared_between_two" ? "shared_between_two" : "private";

  // ── Fetch RSS feed ──────────────────────────────────────────────────────────
  let feedItems;
  try {
    feedItems = await fetchRssFeed(source.feedUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown fetch error";
    console.error(`[ingest/current-affairs] feed fetch failed for ${source.id}:`, message);
    return NextResponse.json(
      { error: `Failed to fetch from ${source.name}: ${message}` },
      { status: 502 }
    );
  }

  if (!feedItems.length) {
    return NextResponse.json({ fetched: 0, inserted: 0, skipped: 0, message: "No items found in feed." });
  }

  // ── Pre-process URLs for deduplication ──────────────────────────────────────
  const preProcessedItems = feedItems.map((item) => {
    const rawNormalized = normalizeIngestionUrl(item.link);
    const finalSourceUrl = normalizeOfficialSourceUrl(rawNormalized);
    return { ...item, finalSourceUrl };
  });

  const incomingUrls = preProcessedItems.map((i) => i.finalSourceUrl);

  const { data: existingRows, error: fetchErr } = await supabase
    .from("current_affairs_entries")
    .select("source_url")
    .eq("user_id", user.id)
    .in("source_url", incomingUrls);

  if (fetchErr && fetchErr.code !== "42P01") {
    console.error("[ingest/current-affairs] dedup check error:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (fetchErr?.code === "42P01") {
    return NextResponse.json(
      { error: "Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql" },
      { status: 503 }
    );
  }

  // We match on exact source_url which is already English-preferred for PIB
  const existingUrls = new Set((existingRows ?? []).map((r) => r.source_url));
  let duplicatesSkipped = 0;
  let sourceSkipped = 0;
  let officialEnglishAllowed = 0;
  let officialHindiAllowed = 0;
  let mixedLanguageAllowed = 0;
  let legalSkipped = 0;

  // ── Build insert rows for new items only ────────────────────────────────────
  const toInsert = [];
  
  for (const item of preProcessedItems) {
    if (existingUrls.has(item.finalSourceUrl)) {
      duplicatesSkipped++;
      continue;
    }

    const headline = item.title || "";
    let description = item.description || "";

    if (source.fetchMode === "discovery") {
      description = ""; // Do not store mostly Hindi RSS descriptions
    }

    const itemData = { title: headline, description, url: item.finalSourceUrl };
    
    const langCheck = shouldSkipForLanguage(itemData, source);
    if (langCheck.skip) {
      sourceSkipped++;
      continue;
    }
    
    if (langCheck.reason === "official_english_allowed") {
      officialEnglishAllowed++;
    } else if (langCheck.reason === "official_hindi_allowed") {
      officialHindiAllowed++;
    } else if (langCheck.reason === "mixed_language_allowed") {
      mixedLanguageAllowed++;
    }
    
    if (shouldSkipForLegalSafety(itemData)) {
      legalSkipped++;
      continue;
    }

    toInsert.push({
      user_id:          user.id,
      headline:         sanitizeIngestedText(headline).slice(0, 500),
      article_date:     item.pubDate ?? new Date().toISOString().split("T")[0],
      source_name:      source.name,
      source_url:       item.finalSourceUrl,
      source_category:  source.category,
      region:           source.region,
      gs_papers:        source.suggestedGsPapers,
      topic:            source.topicHint ?? null,
      subtopic:         null,
      prelims_relevance: false,
      mains_relevance:   false,
      essay_relevance:   false,
      optional_relevance: false,
      importance:        "medium" as const,
      user_notes:        null,
      revision_date:     null,
      tags:              [],
      visibility:        safeVisibility,
      status:            "unread" as const,  // always unread — user reviews
    });
  }

  if (!toInsert.length) {
    return NextResponse.json({
      fetched: feedItems.length,
      inserted: 0,
      skipped: feedItems.length,
      sourceSkipped,
      legalSkipped,
      duplicatesSkipped,
      officialEnglishAllowed,
      officialHindiAllowed,
      mixedLanguageAllowed,
      message: `No new items to insert.`,
    });
  }

  // ── Insert in batch ─────────────────────────────────────────────────────────
  const { error: insertErr } = await supabase
    .from("current_affairs_entries")
    .insert(toInsert);

  if (insertErr) {
    console.error("[ingest/current-affairs] insert error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    fetched: feedItems.length,
    inserted: toInsert.length,
    skipped: feedItems.length - toInsert.length,
    sourceSkipped,
    legalSkipped,
    duplicatesSkipped,
    officialEnglishAllowed,
    officialHindiAllowed,
    mixedLanguageAllowed,
    source: source.name,
    message: `Ingested ${toInsert.length} new items from ${source.name}. All marked unread for your review.`,
  });
}
