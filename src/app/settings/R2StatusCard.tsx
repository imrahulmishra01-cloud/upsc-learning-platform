"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge, { type StatusVariant } from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function R2StatusCard() {
  const [status, setStatus] = useState<"loading" | StatusVariant>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/status/r2", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const data: { ok: boolean; message: string } = await res.json();
        setStatus(data.ok ? "connected" : "pending");
        setMessage(data.message);
      } catch {
        setStatus("error");
        setMessage("Could not reach the R2 status endpoint.");
      }
    };

    checkStatus();
  }, []);

  return (
    <div id="r2-status-card" className="upsc-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Cloudflare R2
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {status === "loading" ? "Checking R2 storage…" : message}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <StatusBadge status={status} />
              <Link
                href="/settings/storage"
                className="text-[10px] px-2 py-1 rounded border hover:opacity-80 transition-opacity"
                style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
              >
                Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
