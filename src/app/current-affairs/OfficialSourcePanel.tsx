"use client";

import { useState } from "react";

interface IngestionSource {
  id: string;
  name: string;
  category: string;
  region: string;
  suggestedGsPapers: string[];
  topicHint: string | null;
  fetchMode: "rss" | "manual_link" | "discovery";
  enabledForAutoFetch: boolean;
  allowed: boolean;
  language: string;
  statusMessage?: string;
}

interface IngestResult {
  fetched?: number;
  inserted: number;
  skipped: number;
  sourceSkipped?: number;
  legalSkipped?: number;
  duplicatesSkipped?: number;
  officialEnglishAllowed?: number;
  officialHindiAllowed?: number;
  mixedLanguageAllowed?: number;
  source?: string;
  message: string;
  error?: string;
}

interface DebugResult {
  status: number;
  contentType: string | null;
  looksLikeXml: boolean;
  first300Chars: string;
  itemCount: number;
  sampleItems: { title: string; link: string }[];
  parseError: string | null;
  reasonZeroItems: string | null;
  discoveryMode?: boolean;
  discoverySamples?: { raw: string; normalized: string }[];
  sourceId?: string;
  fetchMode?: string;
  discoveryUrl?: string;
  displayUrl?: string;
}

interface OfficialSourcePanelProps {
  sources: IngestionSource[];
}

export default function OfficialSourcePanel({ sources }: OfficialSourcePanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, IngestResult>>({});
  const [debugResults, setDebugResults] = useState<Record<string, DebugResult>>({});
  const [visibility, setVisibility] = useState<"private" | "shared_between_two">("private");

  async function ingest(sourceId: string) {
    setLoading(sourceId);
    try {
      const res = await fetch("/api/ingest/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, visibility }),
      });
      const json: IngestResult = await res.json();
      setResults((prev) => ({ ...prev, [sourceId]: json }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [sourceId]: { inserted: 0, skipped: 0, message: "Network error", error: "Network error" },
      }));
    } finally {
      setLoading(null);
    }
  }

  async function debugIngest(sourceId: string) {
    setLoading(sourceId + "-debug");
    try {
      const res = await fetch("/api/ingest/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, visibility, mode: "debug" }),
      });
      const json = await res.json();
      if (json.debugInfo) {
        setDebugResults((prev) => ({ ...prev, [sourceId]: json.debugInfo }));
      } else if (json.error) {
        alert("Debug Error: " + json.error);
      }
    } catch {
      alert("Network error during debug fetch");
    } finally {
      setLoading(null);
    }
  }

  async function ingestAll() {
    for (const src of sources) {
      if (src.enabledForAutoFetch && (src.fetchMode === "rss" || src.fetchMode === "discovery") && src.allowed && src.language === "en") {
        await ingest(src.id);
      }
    }
  }

  return (
    <div>
      {/* Controls row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label
            htmlFor="ingest-visibility"
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            Visibility
          </label>
          <select
            id="ingest-visibility"
            className="input-field"
            style={{ width: "auto", fontSize: "0.8125rem" }}
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "private" | "shared_between_two")
            }
          >
            <option value="private">Private</option>
            <option value="shared_between_two">Shared (both users)</option>
          </select>
        </div>
        <button
          id="ingest-all-sources"
          type="button"
          disabled={loading !== null}
          onClick={ingestAll}
          className="btn-primary"
          style={{ marginTop: "auto" }}
        >
          {loading ? "Fetching…" : "⬇ Fetch All Sources"}
        </button>
      </div>

      {/* Source cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {sources.map((src) => {
          const result = results[src.id];
          const isLoading = loading === src.id;

          return (
            <div
              key={src.id}
              id={`ingest-source-${src.id}`}
              className="upsc-card"
              style={{ padding: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {src.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                    }}
                  >
                    <span className="badge badge-not-configured">
                      {src.category.toUpperCase()}
                    </span>
                    <span className="badge badge-not-configured">
                      {src.region === "national" ? "🇮🇳 National" : "🌐 International"}
                    </span>
                    {src.suggestedGsPapers.map((gs) => (
                      <span key={gs} className="badge badge-connected">
                        {gs}
                      </span>
                    ))}
                    {src.topicHint && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        🏷 {src.topicHint}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }}>
                    {src.enabledForAutoFetch && src.fetchMode === "discovery" && src.allowed ? (
                      <span style={{ color: "var(--color-brand, #6366f1)" }}>✓ Discovery mode - stores official metadata and source links</span>
                    ) : src.enabledForAutoFetch && src.fetchMode === "rss" && src.allowed && src.language === "en" ? (
                      <span style={{ color: "var(--color-success, #4ade80)" }}>✓ Auto-fetch enabled</span>
                    ) : (
                      <span style={{ color: "var(--color-warning, #facc15)" }}>
                        {src.statusMessage || "Manual link only - no reliable safe RSS feed configured"}
                      </span>
                    )}
                  </div>
                </div>

                {src.enabledForAutoFetch && (src.fetchMode === "rss" || src.fetchMode === "discovery") && src.allowed && src.language === "en" && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      disabled={loading !== null}
                      onClick={() => debugIngest(src.id)}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: loading !== null ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {loading === src.id + "-debug" ? "Previewing…" : "🔍 Preview"}
                    </button>
                    <button
                      id={`ingest-fetch-${src.id}`}
                      type="button"
                      disabled={loading !== null}
                      onClick={() => ingest(src.id)}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "0.5rem",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: loading !== null ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      {isLoading && loading !== src.id + "-debug" ? "Fetching…" : "⬇ Fetch"}
                    </button>
                  </div>
                )}
              </div>

              {/* Result banner */}
              {result && (
                <div
                  style={{
                    marginTop: "0.625rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    background: result.error
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(34,197,94,0.08)",
                    border: result.error
                      ? "1px solid rgba(239,68,68,0.25)"
                      : "1px solid rgba(34,197,94,0.25)",
                    fontSize: "0.8125rem",
                    color: result.error ? "#f87171" : "#4ade80",
                  }}
                >
                  {result.error ? `⚠️ ${result.error}` : `✓ ${result.message}`}
                  {!result.error && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap"
                      }}
                    >
                      {result.fetched !== undefined && <span>{result.fetched} {src.fetchMode === "discovery" ? "discovered" : "fetched"}</span>}
                      <span>{result.inserted} new</span>
                      {(result.duplicatesSkipped ?? 0) > 0 && <span>{result.duplicatesSkipped} existing</span>}
                      {(result.officialEnglishAllowed ?? 0) > 0 && <span>{result.officialEnglishAllowed} official English</span>}
                      {(result.officialHindiAllowed ?? 0) > 0 && <span>{result.officialHindiAllowed} official Hindi</span>}
                      {(result.mixedLanguageAllowed ?? 0) > 0 && <span>{result.mixedLanguageAllowed} mixed language</span>}
                      {(result.sourceSkipped ?? 0) > 0 && <span>{result.sourceSkipped} source skipped</span>}
                      {(result.legalSkipped ?? 0) > 0 && <span>{result.legalSkipped} legal skipped</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Debug Result Banner */}
              {debugResults[src.id] && (
                <div
                  style={{
                    marginTop: "0.625rem",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "rgba(0,0,0,0.02)",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.8125rem",
                    color: "var(--color-text-primary)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace"
                  }}
                >
                  <strong>Preview Diagnostics</strong><br/>
                  Source ID: {debugResults[src.id].sourceId}<br/>
                  Fetch Mode: {debugResults[src.id].fetchMode}<br/>
                  Discovery URL: {debugResults[src.id].discoveryUrl}<br/>
                  Status: {debugResults[src.id].status}<br/>
                  Content-Type: {debugResults[src.id].contentType || "none"}<br/>
                  Looks like XML: {debugResults[src.id].looksLikeXml ? "Yes" : "No"}<br/>
                  Item Count: {debugResults[src.id].itemCount}<br/>
                  {debugResults[src.id].parseError && <>Error: {debugResults[src.id].parseError}<br/></>}
                  {debugResults[src.id].reasonZeroItems && <>Zero Items Reason: {debugResults[src.id].reasonZeroItems}<br/></>}
                  <br/>
                  {debugResults[src.id].discoveryMode ? (
                    <>
                      Discovered Links: {debugResults[src.id].discoverySamples?.length || 0}<br/>
                      <br/>
                      <em>Sample Links (First 3):</em><br/>
                      {debugResults[src.id].discoverySamples?.slice(0, 3).map((sample, idx) => (
                        <div key={idx} style={{ marginBottom: "0.5rem", marginLeft: "1rem" }}>
                          Raw: {sample.raw}<br/>
                          → <strong>{sample.normalized}</strong>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <em>Sample Items (First 3):</em>
                      {debugResults[src.id].sampleItems.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ marginLeft: "1rem" }}>- {item.title}</div>
                      ))}
                    </>
                  )}
                  <br/>
                  <em>Raw Preview (First 300 chars):</em><br/>
                  {debugResults[src.id].first300Chars}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        ⚠️ Only official public sources (PIB, PRS, RBI) are fetched. No newspapers
        or paywalled content. All entries are stored as <strong>unread</strong> for
        your review. Only headlines, dates, and source links are stored — never full
        article text.
      </p>
    </div>
  );
}
