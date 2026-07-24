import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { AllowedUser, Profile } from "@/lib/db/types";

export const metadata: Metadata = { title: "Allowed Users" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user[0]}***@${domain}`;
}

async function fetchUsersData(): Promise<{
  allowedUsers: AllowedUser[] | null;
  currentProfile: Profile | null;
  fromDb: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) return { allowedUsers: null, currentProfile: null, fromDb: false };

  try {
    const [{ data: userData }, { data: allowedData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("allowed_users").select("*").order("role"),
    ]);

    const userId = userData.user?.id;
    let profile: Profile | null = null;
    if (userId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profile = profileData as Profile | null;
    }

    return {
      allowedUsers: (allowedData as AllowedUser[] | null) ?? null,
      currentProfile: profile,
      fromDb: !!allowedData,
    };
  } catch {
    return { allowedUsers: null, currentProfile: null, fromDb: false };
  }
}

// Env-var fallback when DB not yet migrated
const ENV_EMAILS = [
  { email: process.env.APP_ALLOWED_EMAIL_1 ?? "", role: "owner" as const, is_active: true },
  { email: process.env.APP_ALLOWED_EMAIL_2 ?? "", role: "second_user" as const, is_active: false },
].filter((u) => !!u.email);

export default async function UsersSettingsPage() {
  const { allowedUsers, currentProfile, fromDb } = await fetchUsersData();

  const displayUsers = fromDb && allowedUsers && allowedUsers.length > 0
    ? allowedUsers
    : ENV_EMAILS.map((u, i) => ({
        id: String(i),
        created_at: "",
        updated_at: "",
        ...u,
      }));

  return (
    <AppShell title="Allowed Users">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Settings
      </Link>

      <div className="flex items-start justify-between mb-1 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Allowed Users
        </h1>
        <span className={`badge ${fromDb ? "badge-connected" : "badge-pending"} mt-1`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${fromDb ? "bg-green-400" : "bg-yellow-400"}`} />
          {fromDb ? "From DB" : "Env vars"}
        </span>
      </div>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        This is a private app. Maximum 2 users. Access is controlled by both env vars
        and the <code className="text-[10px]">allowed_users</code> database table.
      </p>

      {/* Current session */}
      {currentProfile && (
        <div className="upsc-card mb-4 fade-in">
          <p className="section-title mb-2">Current Session</p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{
                background: "rgba(34,197,94,0.15)",
                color: "var(--color-brand)",
              }}
            >
              {(currentProfile.display_name ?? currentProfile.email ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {currentProfile.display_name ?? maskEmail(currentProfile.email)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Role: <span className="font-medium">{currentProfile.role}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="upsc-card fade-in">
        <p className="section-title mb-3">Registered Allowed Users ({displayUsers.length}/2)</p>
        {displayUsers.length === 0 ? (
          <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
            No users configured. Set APP_ALLOWED_EMAIL_1 and APP_ALLOWED_EMAIL_2 in .env.local,
            then apply the Phase 2A migration.
          </p>
        ) : (
          <ul className="space-y-3">
            {displayUsers.map((u, i) => (
              <li key={u.id ?? i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: u.role === "owner"
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(100,116,139,0.15)",
                      color: u.role === "owner"
                        ? "var(--color-brand)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {maskEmail(u.email)}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {u.role} · {u.is_active ? "active" : "inactive"}
                    </p>
                  </div>
                </div>
                <span className={`badge ${u.is_active ? "badge-connected" : "badge-not-configured"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${u.is_active ? "bg-green-400" : "bg-slate-500"}`} />
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="mt-4 p-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(100, 116, 139, 0.08)",
          border: "1px solid rgba(100, 116, 139, 0.2)",
          color: "var(--color-text-muted)",
        }}
      >
        Emails are masked for display. To add or change users, update{" "}
        <code className="text-[10px]">APP_ALLOWED_EMAIL_*</code> env vars and re-run the seed
        block in the migration SQL. No self-registration is permitted.
      </div>
    </AppShell>
  );
}
