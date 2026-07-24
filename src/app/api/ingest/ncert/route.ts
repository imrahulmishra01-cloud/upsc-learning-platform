import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { NCERT_CATALOG } from "@/lib/ingestion/ncert-catalog";
import { shouldSkipForLanguage, sanitizeIngestedText, normalizeIngestionUrl } from "@/lib/ingestion/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/ingest/ncert ─────────────────────────────────────────────────────
// Returns the NCERT catalog for allowed users.
export async function GET() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    total: NCERT_CATALOG.length,
    books: NCERT_CATALOG.map((b) => ({
      title: b.title,
      subject_area: b.subject_area,
      category: b.category,
      official_page_url: b.official_page_url,
      class: b.class,
    })),
  });
}

// ── POST /api/ingest/ncert ────────────────────────────────────────────────────
// Upserts NCERT metadata into material_library.
export async function POST() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { supabase } = auth;

  // Fetch all existing NCERT seed rows by title
  const titles = NCERT_CATALOG.map((b) => b.title);

  const { data: existingRows, error: fetchErr } = await supabase
    .from("material_library")
    .select("id, title, external_url")
    .in("title", titles)
    .eq("is_seed", true);

  if (fetchErr) {
    if (fetchErr.code === "42P01") {
      return NextResponse.json(
        { error: "Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql" },
        { status: 503 }
      );
    }
    console.error("[ingest/ncert] fetch existing error:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const existingByTitle = new Map(
    (existingRows ?? []).map((r) => [r.title, r])
  );

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; external_url: string; permission_notes: string }[] = [];
  let sourceSkipped = 0;
  let officialEnglishAllowed = 0;
  let officialHindiAllowed = 0;
  let mixedLanguageAllowed = 0;

  for (const book of NCERT_CATALOG) {
    const itemData = { title: book.title, url: book.official_page_url };
    const langCheck = shouldSkipForLanguage(itemData);
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
    
    const existing = existingByTitle.get(book.title);
    const sanitizedTitle = sanitizeIngestedText(book.title);
    const normalizedUrl = normalizeIngestionUrl(book.official_page_url);
    const officialNote = `Freely available at ncert.nic.in. Official page: ${normalizedUrl}`;

    if (existing) {
      // Update with official link if it's not set yet or changed
      if (existing.external_url !== normalizedUrl) {
        toUpdate.push({
          id: existing.id,
          external_url: normalizedUrl,
          permission_notes: officialNote,
        });
      }
    } else {
      // Insert new row
      toInsert.push({
        title: sanitizedTitle,
        material_type: "official_link",
        subject_area: book.subject_area,
        category: book.category,
        external_url: normalizedUrl,
        copyright_status: "official_open",
        permission_status: "permission_granted",
        permission_notes: officialNote,
        is_seed: true,
        owned_by_user: false,
        visibility: "shared_between_two",
        status: "active",
      });
    }
  }

  let inserted = 0;
  let updated = 0;

  // Insert new rows
  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from("material_library")
      .insert(toInsert);

    if (insertErr) {
      console.error("[ingest/ncert] insert error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    inserted = toInsert.length;
  }

  // Update existing rows with official URL
  for (const row of toUpdate) {
    const { error: updateErr } = await supabase
      .from("material_library")
      .update({ external_url: row.external_url, permission_notes: row.permission_notes })
      .eq("id", row.id);

    if (updateErr) {
      console.error("[ingest/ncert] update error for", row.id, updateErr);
      // Non-fatal — continue with others
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    inserted,
    updated,
    unchanged: NCERT_CATALOG.length - inserted - updated - sourceSkipped,
    sourceSkipped,
    officialEnglishAllowed,
    officialHindiAllowed,
    mixedLanguageAllowed,
    total: NCERT_CATALOG.length,
    message: `NCERT metadata sync: ${inserted} new, ${updated} updated. No PDFs downloaded.`,
  });
}
