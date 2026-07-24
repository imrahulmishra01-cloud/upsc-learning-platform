"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      // Silently fail – redirect happens regardless
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="sign-out-button"
      onClick={handleSignOut}
      disabled={loading}
      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50"
      style={{
        color: "var(--color-text-secondary)",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
