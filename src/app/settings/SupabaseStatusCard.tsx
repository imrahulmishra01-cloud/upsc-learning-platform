"use client";

import { useEffect, useState } from "react";
import StatusBadge, { type StatusVariant } from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SupabaseStatusCard() {
  const [status, setStatus] = useState<"loading" | StatusVariant>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // cache: "no-store" ensures this is never served from the browser cache.
        // Each mount gets a fresh live result from the server.
        const res = await fetch("/api/status/supabase", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const data: { ok: boolean; message: string } = await res.json();
        setStatus(data.ok ? "connected" : "pending");
        setMessage(data.message);
      } catch {
        setStatus("error");
        setMessage("Could not reach the status endpoint.");
      }
    };

    checkStatus();
  }, []);

  return (
    <div id="supabase-status-card" className="upsc-card">
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Supabase
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {status === "loading" ? "Checking connection…" : message}
          </p>
        </div>
        {status === "loading" ? (
          <LoadingSpinner size="sm" />
        ) : (
          <StatusBadge status={status} />
        )}
      </div>
    </div>
  );
}
