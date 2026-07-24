import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { SourceRegistry } from "@/lib/db/types";

export const metadata: Metadata = { title: "Source Registry" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fallback list shown before migration is applied
const APPROVED_SOURCES_STATIC = [
  { name: "UPSC",              domain: "upsc.gov.in",              category: "government" },
  { name: "NCERT",             domain: "ncert.nic.in",             category: "education" },
  { name: "PIB",               domain: "pib.gov.in",               category: "government" },
  { name: "India Budget",      domain: "indiabudget.gov.in",        category: "government" },
  { name: "India Code",        domain: "indiacode.nic.in",          category: "government" },
  { name: "PRS India",         domain: "prsindia.org",              category: "research" },
  { name: "Sansad",            domain: "sansad.in",                 category: "government" },
  { name: "RBI",               domain: "rbi.org.in",                category: "government" },
  { name: "NITI Aayog",        domain: "niti.gov.in",               category: "government" },
  { name: "SDG India Index",   domain: "sdgindiaindex.niti.gov.in", category: "government" },
  { name: "Census India",      domain: "censusindia.gov.in",        category: "government" },
  { name: "NFHS/IIPS",         domain: "nfhsiips.in",               category: "research" },
  { name: "IIPS India",        domain: "iipsindia.ac.in",           category: "research" },
  { name: "MoEFCC",            domain: "moef.gov.in",               category: "government" },
  { name: "CPCB",              domain: "cpcb.nic.in",               category: "government" },
  { name: "MEA",               domain: "mea.gov.in",                category: "government" },
  { name: "United Nations",    domain: "un.org",                    category: "international" },
  { name: "World Bank",        domain: "worldbank.org",             category: "international" },
  { name: "World Bank Data",   domain: "data.worldbank.org",        category: "international" },
  { name: "IMF",               domain: "imf.org",                   category: "international" },
  { name: "WTO",               domain: "wto.org",                   category: "international" },
  { name: "WHO",               domain: "who.int",                   category: "international" },
  { name: "UNFCCC",            domain: "unfccc.int",                category: "international" },
  { name: "UNEP",              domain: "unep.org",                  category: "international" },
  { name: "IPCC",              domain: "ipcc.ch",                   category: "international" },
  { name: "The Hindu",         domain: "thehindu.com",              category: "newspaper" },
  { name: "Indian Express",    domain: "indianexpress.com",         category: "newspaper" },
  { name: "LiveMint",          domain: "livemint.com",              category: "newspaper" },
  { name: "Business Standard", domain: "business-standard.com",    category: "newspaper" },
];

const CATEGORY_LABEL: Record<string, string> = {
  government: "🏛️ Government",
  international: "🌐 International",
  education: "📚 Education",
  research: "🔬 Research",
  newspaper: "📰 Newspapers",
};

async function fetchSources(): Promise<{ sources: SourceRegistry[] | null; fromDb: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { sources: null, fromDb: false };

  try {
    const { data, error } = await supabase
      .from("source_registry")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name");

    if (error || !data || data.length === 0) return { sources: null, fromDb: false };
    return { sources: data as SourceRegistry[], fromDb: true };
  } catch {
    return { sources: null, fromDb: false };
  }
}

export default async function SourcesSettingsPage() {
  const { sources, fromDb } = await fetchSources();

  // Use live DB data if available, else static fallback
  const displaySources = fromDb && sources
    ? sources
    : APPROVED_SOURCES_STATIC.map((s, i) => ({
        id: String(i),
        ...s,
        description: null,
        is_active: true,
        is_seed: true,
        created_at: "",
        updated_at: "",
      }));

  // Group by category
  const grouped = displaySources.reduce<Record<string, typeof displaySources>>((acc, s) => {
    const cat = s.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryOrder = ["government", "international", "education", "research", "newspaper"];

  return (
    <AppShell title="Source Registry">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Settings
      </Link>

      <div className="flex items-start justify-between mb-1 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Source Registry
        </h1>
        <span className={`badge ${fromDb ? "badge-connected" : "badge-pending"} mt-1`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${fromDb ? "bg-green-400" : "bg-yellow-400"}`} />
          {fromDb ? "From DB" : "Static fallback"}
        </span>
      </div>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        {displaySources.length} approved sources across {Object.keys(grouped).length} categories.
        {!fromDb && " Apply migration to load from database."}
      </p>

      <div className="space-y-4 fade-in">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="upsc-card">
              <p className="section-title mb-3">{CATEGORY_LABEL[cat] ?? cat}</p>
              <ul className="space-y-2">
                {items.map((src) => (
                  <li
                    key={src.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className="font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {src.name}
                    </span>
                    <code
                      className="text-[10px] font-mono"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {src.domain}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 p-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(34, 197, 94, 0.06)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "#4ade80" }}>Newspaper rule:</strong>{" "}
        Only headline, date, source name, link, user notes, UPSC relevance, topic tags, and
        revision date are stored. Full article text is never stored. No paywalls bypassed.
      </div>
    </AppShell>
  );
}
