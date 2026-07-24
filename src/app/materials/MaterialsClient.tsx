"use client";

import { useState, useMemo } from "react";
import { MaterialLibrary } from "@/lib/db/types";
import Link from "next/link";

type MaterialWithFile = MaterialLibrary & {
  uploaded_files?: {
    mime_type: string | null;
    upload_status: string;
  } | null;
};

const TAB_FILTERS: { label: string; value: string; filter: (m: MaterialWithFile) => boolean }[] = [
  { label: "All", value: "all", filter: () => true },
  { label: "NCERT", value: "ncert", filter: (m) => (m.subject_area || "").includes("NCERT") },
  { label: "GS1", value: "gs1", filter: (m) => (m.subject_area || "").startsWith("GS1") || (m.category || "").startsWith("GS1") },
  { label: "GS2", value: "gs2", filter: (m) => (m.subject_area || "").startsWith("GS2") || (m.category || "").startsWith("GS2") },
  { label: "GS3", value: "gs3", filter: (m) => (m.subject_area || "").startsWith("GS3") || (m.category || "").startsWith("GS3") },
  { label: "GS4/Ethics", value: "gs4", filter: (m) => (m.subject_area || "").includes("GS4") || (m.subject_area || "").includes("Ethics") },
  { label: "Essay", value: "essay", filter: (m) => (m.subject_area || "").includes("Essay") },
  { label: "CSAT", value: "csat", filter: (m) => (m.subject_area || "").includes("CSAT") },
  { label: "Curr. Affairs", value: "ca", filter: (m) => (m.subject_area || "").includes("Current Affairs") },
  { label: "Geo Opt.", value: "geo", filter: (m) => (m.subject_area || "").includes("Geography Optional") },
  { label: "Hist Opt.", value: "hist", filter: (m) => (m.subject_area || "").includes("History Optional") },
  { label: "Official", value: "official", filter: (m) => m.material_type === "official_link" || (m.subject_area || "").includes("Official Sources") },
  { label: "My Uploads", value: "uploads", filter: (m) => !m.is_seed && m.material_type === "uploaded_file" },
];

const STATUS_FILTERS: { label: string; filter: (m: MaterialWithFile) => boolean }[] = [
  { label: "All", filter: () => true },
  { label: "Uploaded", filter: (m) => m.uploaded_files?.upload_status === "uploaded" },
  { label: "Placeholder", filter: (m) => m.is_seed && m.material_type === "seed_placeholder" },
  { label: "Official Link", filter: (m) => m.material_type === "official_link" },
];

function isReadable(mimeType: string | null) {
  if (!mimeType) return false;
  return mimeType === "application/pdf" || mimeType.startsWith("image/") || mimeType === "text/plain";
}

function copyrightBadge(status: string | null) {
  if (!status) return null;
  const config: Record<string, { label: string; cls: string }> = {
    official_open: { label: "Official/Open", cls: "badge-connected" },
    public_domain: { label: "Public Domain", cls: "badge-connected" },
    copyrighted: { label: "Copyrighted", cls: "badge-not-configured" },
    unknown: { label: "Unknown", cls: "badge-pending" },
  };
  const c = config[status];
  if (!c) return null;
  return <span className={`badge ${c.cls} text-[8px]`}>{c.label}</span>;
}

export default function MaterialsClient({ initialMaterials }: { initialMaterials: MaterialWithFile[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [activeStatus, setActiveStatus] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const tabFn = TAB_FILTERS.find(t => t.value === activeTab)?.filter ?? (() => true);
    const statusFn = STATUS_FILTERS[activeStatus]?.filter ?? (() => true);
    const q = search.toLowerCase().trim();
    return initialMaterials.filter(m =>
      tabFn(m) &&
      statusFn(m) &&
      (!q || m.title.toLowerCase().includes(q) || (m.subject_area || "").toLowerCase().includes(q) || (m.category || "").toLowerCase().includes(q))
    );
  }, [initialMaterials, activeTab, activeStatus, search]);

  const subjects = useMemo(() =>
    Array.from(new Set(filtered.map(m => m.subject_area || "Other"))).sort(),
    [filtered]
  );

  async function handleDownload(fileId: string) {
    try {
      setError(null);
      const res = await fetch(`/api/materials/download?fileId=${fileId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");
      window.location.href = data.downloadUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  return (
    <div className="fade-in">
      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search materials..."
          className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--color-bg-secondary)] focus:outline-none focus:border-green-500"
          style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
        />
      </div>

      {/* Subject Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {TAB_FILTERS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${activeTab === tab.value ? "text-white" : ""}`}
            style={{
              background: activeTab === tab.value ? "var(--color-brand)" : "var(--color-bg-secondary)",
              color: activeTab === tab.value ? "#fff" : "var(--color-text-muted)",
              border: `1px solid ${activeTab === tab.value ? "transparent" : "var(--color-border)"}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((sf, i) => (
          <button
            key={sf.label}
            onClick={() => setActiveStatus(i)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${activeStatus === i ? "font-semibold" : ""}`}
            style={{
              color: activeStatus === i ? "var(--color-brand)" : "var(--color-text-muted)",
              borderBottom: activeStatus === i ? "2px solid var(--color-brand)" : "2px solid transparent",
            }}
          >
            {sf.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] flex items-center" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Materials List */}
      {filtered.length === 0 ? (
        <div className="upsc-card text-center py-8">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {search ? "No materials match your search." : "No materials in this category."}
          </p>
        </div>
      ) : (
        subjects.map(subject => {
          const items = filtered.filter(m => (m.subject_area || "Other") === subject);
          if (items.length === 0) return null;
          return (
            <div key={subject} className="mb-6">
              <h2 className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--color-brand)" }}>
                {subject}
                <span className="font-normal opacity-60">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {items.map(item => {
                  const isUploaded = item.uploaded_files?.upload_status === "uploaded";
                  const readable = isUploaded && isReadable(item.uploaded_files?.mime_type ?? null);
                  const isPlaceholder = item.is_seed && item.material_type === "seed_placeholder";
                  const isOfficialLink = item.material_type === "official_link";

                  return (
                    <div key={item.id} className="upsc-card" style={{ padding: "0.75rem" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {isPlaceholder && (
                              <span className="text-base flex-shrink-0" title="Placeholder">📋</span>
                            )}
                            {isOfficialLink && (
                              <span className="text-base flex-shrink-0" title="Official Link">🔗</span>
                            )}
                            {isUploaded && (
                              <span className="text-base flex-shrink-0" title="Uploaded">📄</span>
                            )}
                            <span className="font-medium text-xs" style={{ color: "var(--color-text-primary)" }}>
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {copyrightBadge(item.copyright_status)}
                            {isUploaded && readable && (
                              <span className="badge badge-connected text-[8px]">Readable</span>
                            )}
                            {isPlaceholder && item.permission_status === "pending" && (
                              <span className="badge badge-not-configured text-[8px]">Upload Required</span>
                            )}
                            {isOfficialLink && (
                              <span className="badge badge-connected text-[8px]">Open Access</span>
                            )}
                          </div>

                          {item.permission_notes && isPlaceholder && (
                            <p className="text-[9px] mt-1" style={{ color: "var(--color-text-muted)" }}>{item.permission_notes}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isOfficialLink && item.external_url && (
                            <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] px-2 py-1 rounded-lg border hover:opacity-80 transition-opacity"
                              style={{ color: "var(--color-brand)", borderColor: "var(--color-brand)", opacity: 0.8 }}>
                              Visit
                            </a>
                          )}
                          {readable && item.id && (
                            <Link href={`/materials/${item.id}`}
                              className="text-[10px] px-2 py-1 rounded-lg"
                              style={{ background: "var(--color-brand)", color: "#fff" }}>
                              Read
                            </Link>
                          )}
                          {isUploaded && item.uploaded_file_id && (
                            <button onClick={() => handleDownload(item.uploaded_file_id!)}
                              className="text-[10px] px-2 py-1 rounded-lg border hover:opacity-80"
                              style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}>
                              Download
                            </button>
                          )}
                          {isPlaceholder && item.permission_status === "pending" && (
                            <Link href="/materials/upload"
                              className="text-[10px] px-2 py-1 rounded-lg border hover:opacity-80"
                              style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
                              Upload
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
