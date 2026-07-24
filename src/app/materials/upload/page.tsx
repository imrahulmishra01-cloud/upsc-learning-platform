import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { isR2Configured } from "@/lib/r2/client";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const r2Ok = isR2Configured();

  return (
    <AppShell title="Upload Material">
      {/* Back */}
      <Link
        href="/materials"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Back to Vault
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Upload Material
      </h1>
      <p className="text-xs mb-6 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Securely store files in your private R2 vault.
      </p>

      {!r2Ok ? (
        <div className="upsc-card fade-in text-center py-8">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-sm font-semibold mb-1 text-red-500">R2 Not Configured</h2>
          <p className="text-xs text-muted max-w-[250px] mx-auto">
            Cloudflare R2 environment variables are missing from your .env.local file.
          </p>
          <div className="mt-4">
            <Link href="/settings/storage" className="text-xs underline text-blue-500">
              Check Storage Settings
            </Link>
          </div>
        </div>
      ) : (
        <UploadForm />
      )}
    </AppShell>
  );
}
