import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import IncubatorList from "./IncubatorList";

export const metadata: Metadata = { title: "Optional Subject" };
export const dynamic = "force-dynamic";

const GEO_SECTIONS = [
  "Geomorphology", "Climatology", "Oceanography", "Biogeography",
  "Environmental Geography", "Human Geography", "Population Geography",
  "Settlement Geography", "Economic Geography", "Regional Planning",
  "Models and Theories", "Indian Geography", "Resources",
  "Agriculture", "Industry", "Transport and Trade", "Political Aspects",
  "Contemporary Issues", "Map Work",
];

const HISTORY_SECTIONS = [
  "Ancient India", "Medieval India", "Modern India",
  "World History", "Post-Independence India",
  "Art and Culture", "Socio-Religious Movements",
  "Indian National Movement", "Constitutional Development",
  "Post-War World Order",
];

interface QuickLink {
  href: string;
  icon: string;
  label: string;
}

const QUICK_LINKS: QuickLink[] = [
  { href: "/optional/geography",   icon: "🌍", label: "Geography Optional" },
  { href: "/optional/history",     icon: "📜", label: "History Optional"   },
  { href: "/optional/syllabus",    icon: "📋", label: "Syllabus"           },
  { href: "/optional/materials",   icon: "📚", label: "Materials"          },
  { href: "/optional/pyq",         icon: "❓", label: "PYQs"               },
  { href: "/optional/revision",    icon: "🔁", label: "Revision"           },
];

export default async function OptionalPage() {
  const supabase = await createClient();
  let optionalSubject: string | null = null;
  let profileMissing = false;

  if (!supabase) {
    profileMissing = true;
  } else {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Try app_settings first, then profiles
      try {
        const { data: settings, error: sErr } = await supabase
          .from("app_settings")
          .select("optional_subject")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!sErr && settings?.optional_subject) {
          optionalSubject = settings.optional_subject as string;
        }
      } catch {
        // table may not exist yet
      }

      if (!optionalSubject) {
        try {
          const { data: profile, error: pErr } = await supabase
            .from("profiles")
            .select("optional_subject")
            .eq("id", user.id)
            .maybeSingle();

          if (!pErr && profile?.optional_subject) {
            optionalSubject = profile.optional_subject as string;
          }
        } catch {
          profileMissing = true;
        }
      }
    }
  }

  const subjectLabel = optionalSubject ?? "Not set";
  const isGeo = optionalSubject?.toLowerCase().includes("geograph");
  const isHistory = optionalSubject?.toLowerCase().includes("histor");

  return (
    <AppShell title="Optional Subject">
      {/* Header */}
      <div className="mb-5 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Optional Subject
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Deep-dive into your optional paper preparation
        </p>
      </div>

      {/* Current optional badge */}
      <div
        className="upsc-card mb-5 fade-in flex items-center gap-3"
        style={{ borderColor: "var(--color-brand-border)" }}
      >
        <span className="text-2xl">{isGeo ? "🌍" : isHistory ? "📜" : "📖"}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Your Optional Subject
          </p>
          <p className="text-base font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
            {subjectLabel}
          </p>
          {profileMissing && (
            <p className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>
              ⚠ Profile table not available — run migration to save your subject preference.
            </p>
          )}
        </div>
        <Link
          href="/settings"
          className="ml-auto text-xs px-3 py-1 rounded-lg"
          style={{ background: "var(--color-brand-dim)", color: "var(--color-brand)" }}
        >
          Change
        </Link>
      </div>

      {/* Quick navigation */}
      <p className="section-title fade-in">Quick Access</p>
      <div className="grid grid-cols-2 gap-3 mb-6 fade-in sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            id={`optional-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="upsc-card no-underline flex flex-col items-center gap-2 text-center py-4"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 mb-4 fade-in">
        <p className="section-title !mb-0">Optional / Essay Incubator</p>
        <Link href="/current-affairs" className="text-xs" style={{ color: "var(--color-brand)" }}>
          Manage →
        </Link>
      </div>
      <IncubatorList />

      {/* Geography Sections */}
      <p className="section-title fade-in">Geography Optional — Sections</p>
      <div className="grid grid-cols-1 gap-2 mb-6 fade-in sm:grid-cols-2">
        {GEO_SECTIONS.map((section) => (
          <Link
            key={section}
            href={`/optional/geography?section=${encodeURIComponent(section)}`}
            className="upsc-card no-underline flex items-center gap-3 py-3 px-4"
          >
            <span className="text-base">🌏</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {section}
            </span>
            <span
              className="badge badge-not-configured ml-auto text-xs"
              style={{ fontSize: "0.65rem" }}
            >
              Not started
            </span>
          </Link>
        ))}
      </div>

      {/* History Sections */}
      <p className="section-title fade-in">History Optional — Sections</p>
      <div className="grid grid-cols-1 gap-2 fade-in sm:grid-cols-2">
        {HISTORY_SECTIONS.map((section) => (
          <Link
            key={section}
            href={`/optional/history?section=${encodeURIComponent(section)}`}
            className="upsc-card no-underline flex items-center gap-3 py-3 px-4"
          >
            <span className="text-base">📜</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {section}
            </span>
            <span
              className="badge badge-not-configured ml-auto text-xs"
              style={{ fontSize: "0.65rem" }}
            >
              Not started
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
