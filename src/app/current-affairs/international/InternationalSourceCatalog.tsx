"use client";

import { IngestionSource } from "@/lib/ingestion/sources";

interface InternationalSourceCatalogProps {
  sources: IngestionSource[];
}

export default function InternationalSourceCatalog({ sources }: InternationalSourceCatalogProps) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
        International Source Catalog
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
        International sources are metadata/link-only. Use Open Source to read official pages.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {sources.map((src) => (
          <div
            key={src.id}
            id={`intl-source-${src.id}`}
            className="upsc-card fade-in"
            style={{ padding: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
                  {src.name}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                  <span className="badge badge-not-configured">
                    {src.category.toUpperCase()}
                  </span>
                  <span className="badge badge-not-configured">
                    🌐 {src.region === "international" ? "International" : src.region}
                  </span>
                  {src.suggestedGsPapers.map((gs) => (
                    <span key={gs} className="badge badge-connected">
                      {gs}
                    </span>
                  ))}
                  {src.topicHint && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      🏷 {src.topicHint}
                    </span>
                  )}
                </div>
                
                <div style={{ fontSize: "0.8125rem" }}>
                  {src.enabledForAutoFetch ? (
                    <span style={{ color: "var(--color-success, #4ade80)" }}>✓ Auto-fetch enabled</span>
                  ) : (
                    <span style={{ color: "var(--color-warning, #facc15)" }}>
                      {src.statusMessage || "Manual link only - no verified safe RSS/API configured"}
                    </span>
                  )}
                </div>
              </div>

              {src.displayUrl && (
                <a
                  href={src.displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open official source"
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "0.5rem",
                    background: "rgba(99,102,241,0.08)",
                    color: "var(--color-brand)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid rgba(99,102,241,0.2)"
                  }}
                >
                  ↗ Open Source
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
