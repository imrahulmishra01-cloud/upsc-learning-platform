import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { isR2Configured, getR2BucketName } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StorageSettingsPage() {
  const r2Ok = isR2Configured();
  const bucketName = getR2BucketName();

  const supabase = await createClient();
  let tableMissing = false;
  let fileCount = 0;

  if (!supabase) {
    tableMissing = true;
  } else {
    try {
      const { count, error } = await supabase
        .from("uploaded_files")
        .select("*", { count: "exact", head: true });
        
      if (error && error.code === "42P01") {
        tableMissing = true;
      } else if (!error && count !== null) {
        fileCount = count;
      }
    } catch {
      tableMissing = true;
    }
  }

  return (
    <AppShell title="Storage Settings">
      {/* Back */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Settings
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Material Vault Storage
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Manage Cloudflare R2 connection for secure file uploads.
      </p>

      {/* R2 Config Status */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Cloudflare R2</p>
          <span className={`badge ${r2Ok ? "badge-connected" : "badge-not-configured"}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${r2Ok ? "bg-green-400" : "bg-slate-500"}`} />
            {r2Ok ? "Configured" : "Missing Config"}
          </span>
        </div>

        <ul className="space-y-3 text-xs mb-4">
          <li className="flex justify-between border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Bucket Name</span>
            <span className="font-mono">{bucketName || "—"}</span>
          </li>
          <li className="flex justify-between border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Environment Variables</span>
            <span style={{ color: r2Ok ? "var(--color-brand)" : "#f59e0b" }}>
              {r2Ok ? "Ready" : "Missing in .env.local"}
            </span>
          </li>
        </ul>

        {!r2Ok && (
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "var(--color-text-secondary)",
            }}
          >
            <strong>Action Required:</strong> Add <code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, and <code>R2_BUCKET_NAME</code> to your <code>.env.local</code> file.
          </div>
        )}
      </div>

      {/* Database Integration Status */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Database Integration</p>
          <span className={`badge ${!tableMissing ? "badge-connected" : "badge-not-configured"}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${!tableMissing ? "bg-green-400" : "bg-slate-500"}`} />
            {!tableMissing ? "Ready" : "Migration Pending"}
          </span>
        </div>

        <ul className="space-y-3 text-xs">
          <li className="flex justify-between border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
            <span style={{ color: "var(--color-text-muted)" }}><code>uploaded_files</code> table</span>
            <span className={!tableMissing ? "text-green-500" : "text-yellow-500"}>
              {!tableMissing ? "Exists" : "Missing"}
            </span>
          </li>
          <li className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Total files in DB</span>
            <span className="font-mono">{!tableMissing ? fileCount : "—"}</span>
          </li>
        </ul>

        {tableMissing && (
          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "var(--color-text-secondary)" }}>
            Apply the Phase 3A database migration to enable file tracking.
          </div>
        )}
      </div>
    </AppShell>
  );
}
