"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  
  const [status, setStatus] = useState<"idle" | "presigning" | "uploading" | "completing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!legalConsent) {
      setErrorMsg("You must confirm legal rights to upload.");
      return;
    }

    try {
      setErrorMsg("");
      setStatus("presigning");

      // 1. Get presigned URL
      const presignRes = await fetch("/api/materials/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          category,
          description,
          legalConsentGiven: legalConsent,
        }),
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Failed to get upload URL");

      const { uploadUrl, fileId } = presignData;

      // 2. Upload direct to R2
      setStatus("uploading");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file to storage bucket");

      // 3. Complete upload
      setStatus("completing");
      const completeRes = await fetch("/api/materials/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error || "Failed to complete upload");

      setStatus("success");
      setTimeout(() => {
        router.push("/materials");
        router.refresh();
      }, 1500);

    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upsc-card fade-in">
      {/* File input */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Select File
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={status !== "idle" && status !== "error"}
          className="w-full text-xs p-2 rounded-lg border focus:outline-none focus:border-green-500"
          style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
        />
        {file && (
          <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={status !== "idle" && status !== "error"}
          className="w-full text-xs p-2 rounded-lg border focus:outline-none focus:border-green-500"
          style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
        >
          <option value="ncert">NCERT</option>
          <option value="standard_book">Standard Book</option>
          <option value="pyq">PYQ</option>
          <option value="mains_answer">Mains Answer</option>
          <option value="notes">Notes</option>
          <option value="current_affairs">Current Affairs</option>
          <option value="official_source">Official Source</option>
          <option value="optional">Optional Subject</option>
          <option value="csat">CSAT</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Chapter 1 to 5"
          disabled={status !== "idle" && status !== "error"}
          className="w-full text-xs p-2 rounded-lg border focus:outline-none focus:border-green-500"
          style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
        />
      </div>

      {/* Legal Consent Checkbox */}
      <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={legalConsent}
            onChange={(e) => setLegalConsent(e.target.checked)}
            disabled={status !== "idle" && status !== "error"}
            className="mt-0.5"
          />
          <span className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            <strong>Upload only files you own, have permission to store, or are legally allowed to use.</strong>
            <br />
            <span className="opacity-80">I confirm I have the right to store this file for my personal study.</span>
          </span>
        </label>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2 rounded-lg text-xs bg-red-50 text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {status === "success" && (
        <div className="mb-4 p-2 rounded-lg text-xs bg-green-50 text-green-700 border border-green-200">
          Upload complete! Redirecting...
        </div>
      )}

      <button
        type="submit"
        disabled={!file || !legalConsent || (status !== "idle" && status !== "error")}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: (!file || !legalConsent || (status !== "idle" && status !== "error")) ? "rgba(100,116,139,0.1)" : "var(--color-brand)",
          color: (!file || !legalConsent || (status !== "idle" && status !== "error")) ? "var(--color-text-muted)" : "#ffffff",
          cursor: (!file || !legalConsent || (status !== "idle" && status !== "error")) ? "not-allowed" : "pointer",
        }}
      >
        {status === "idle" && "Upload File"}
        {status === "presigning" && "Preparing..."}
        {status === "uploading" && "Uploading to R2..."}
        {status === "completing" && "Verifying..."}
        {status === "success" && "Done"}
        {status === "error" && "Try Again"}
      </button>
    </form>
  );
}
