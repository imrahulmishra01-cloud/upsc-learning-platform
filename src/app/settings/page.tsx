import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import SupabaseStatusCard from "./SupabaseStatusCard";
import R2StatusCard from "./R2StatusCard";

export const metadata: Metadata = {
  title: "Settings",
};

const ALLOWED_EMAILS_DISPLAY = [
  process.env.APP_ALLOWED_EMAIL_1 ?? "",
  process.env.APP_ALLOWED_EMAIL_2 ?? "",
].filter(Boolean);

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user[0]}***@${domain}`;
}

export default async function SettingsPage() {
  // Get current user
  const supabase = await createClient();
  let userEmail: string | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  const ownerName = process.env.APP_OWNER_NAME ?? "User";

  return (
    <AppShell title="Settings">
      <h1
        className="text-xl font-bold mb-5 fade-in"
        style={{ color: "var(--color-text-primary)" }}
      >
        Settings
      </h1>

      <div className="space-y-3 fade-in">

        {/* ── Profile ──────────────────────────────────────────── */}
        <section id="settings-profile">
          <p className="section-title">Profile</p>
          <div className="upsc-card">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{
                  background: "var(--color-brand-dim, rgba(34,197,94,0.15))",
                  color: "var(--color-brand)",
                }}
              >
                {ownerName[0] ?? "U"}
              </div>
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {ownerName}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {userEmail ?? "Not signed in"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Allowed Users ─────────────────────────────────────── */}
        <section id="settings-allowed-users">
          <p className="section-title">Allowed Users</p>
          <div className="upsc-card">
            <p
              className="text-xs mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Only these email addresses can request login. Set via{" "}
              <code
                className="px-1 py-0.5 rounded text-xs"
                style={{ background: "var(--color-bg-secondary)" }}
              >
                APP_ALLOWED_EMAIL_*
              </code>{" "}
              environment variables.
            </p>
            {ALLOWED_EMAILS_DISPLAY.length === 0 ? (
              <p
                className="text-xs italic"
                style={{ color: "var(--color-text-muted)" }}
              >
                No allowed emails configured. Set APP_ALLOWED_EMAIL_1 and
                APP_ALLOWED_EMAIL_2 in your .env.local file.
              </p>
            ) : (
              <ul className="space-y-2">
                {ALLOWED_EMAILS_DISPLAY.map((email, i) => (
                  <li
                    key={email}
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {i + 1}
                    </span>
                    {maskEmail(email)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Phase 2A sub-pages ────────────────────────────────── */}
        <section id="settings-phase2a">
          <p className="section-title">Phase 2A — Database Foundation</p>
          <div className="space-y-2">
            {[
              { href: "/settings/database", icon: "🗄️", label: "Database Status",   desc: "Phase 2A table checklist" },
              { href: "/settings/security", icon: "🔒", label: "Security & RLS",     desc: "Allowlist access model and policies" },
              { href: "/settings/sources",  icon: "🌐", label: "Source Registry",    desc: "29 approved UPSC sources" },
              { href: "/settings/users",    icon: "👥", label: "Allowed Users",      desc: "Manage the email allowlist" },
            ].map(({ href, icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="upsc-card flex items-center justify-between no-underline group"
                id={`settings-link-${href.split("/").pop()}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {desc}
                    </p>
                  </div>
                </div>
                <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Supabase Status ───────────────────────────────────── */}
        <section id="settings-supabase-status">
          <p className="section-title">Supabase Status</p>
          <SupabaseStatusCard />
        </section>

        {/* ── R2 Status ─────────────────────────────────────────── */}
        <section id="settings-r2-status">
          <p className="section-title">R2 Storage Status</p>
          <R2StatusCard />
        </section>

        {/* ── Gemini Status ─────────────────────────────────────── */}
        <section id="settings-gemini-status">
          <p className="section-title">Gemini AI Status</p>
          <div className="upsc-card">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Google Gemini API
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  AI answer evaluation and feedback. Configured in Phase 2.
                </p>
              </div>
              <span className="badge badge-not-configured">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                Not configured
              </span>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
