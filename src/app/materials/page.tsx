import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { MaterialLibrary } from "@/lib/db/types";
import MaterialsClient from "./MaterialsClient";
import NcertSyncButton from "./NcertSyncButton";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  let materials: MaterialLibrary[] = [];
  let tableMissing = false;
  const supabase = await createClient();

  if (!supabase) {
    tableMissing = true;
  } else {
    await supabase.auth.getUser();

    // Try to fetch materials. If table doesn't exist, it will throw an error safely handled.

    try {
      const { data, error } = await supabase
        .from("material_library")
        .select(`
          id, 
          title, 
          description, 
          material_type, 
          subject_area, 
          category, 
          visibility, 
          is_seed, 
          status, 
          copyright_status, 
          permission_status,
          permission_notes,
          owned_by_user,
          uploaded_file_id,
          uploaded_files(mime_type, upload_status)
        `)
        .neq("status", "archived")
        .order("subject_area", { ascending: true })
        .order("title", { ascending: true });
        
      if (error) {
        if (error.code === "42P01") { // undefined_table
          tableMissing = true;
        } else {
          console.error("Error fetching materials:", error);
        }
      } else if (data) {
        materials = data as unknown as MaterialLibrary[];
      }
    } catch {
      tableMissing = true;
    }
  }

  return (
    <AppShell title="Material Vault">
      <div className="flex items-center justify-between mb-4 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Required Reading Matrix
        </h1>
        <Link
          href="/materials/upload"
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={{
            background: "var(--color-brand)",
            color: "#ffffff",
          }}
        >
          + Upload File
        </Link>
      </div>

      <p className="text-sm mb-6 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Organize your official references, required readings, and personal uploads compliantly.
      </p>

      {/* NCERT Sync Section */}
      {!tableMissing && (
        <div className="upsc-card fade-in" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
          <p className="section-title" style={{ marginBottom: "0.625rem" }}>📚 NCERT Official Metadata Sync</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.875rem", lineHeight: 1.6 }}>
            Sync official ncert.nic.in page links into your Material Library. Updates existing placeholders with official links.
            No PDFs are downloaded.
          </p>
          <NcertSyncButton />
        </div>
      )}

      {tableMissing ? (
        <div className="upsc-card fade-in text-center py-10">
          <p className="text-4xl mb-4">🗄️</p>
          <h2 className="text-sm font-semibold mb-2">Vault Not Initialized</h2>
          <p className="text-xs text-muted max-w-[250px] mx-auto leading-relaxed">
            Please apply the Phase 3A database migration to enable the Material Vault.
          </p>
        </div>
      ) : (
        <MaterialsClient initialMaterials={materials} />
      )}
    </AppShell>
  );
}
