"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const trimmedEmail = email.trim().toLowerCase();

      // Check allowlist via server-side API to avoid exposing emails to client
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!checkRes.ok) {
        const data = await checkRes.json().catch(() => ({}));
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      // Email is allowed – send magic link
      const supabase = await createClient();
      if (!supabase) {
        setError("Supabase is not configured. See .env.example.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    });
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">📚</div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          UPSC Prep
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Private learning workspace
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 fade-in"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Connection pending banner */}
        {!supabaseConfigured && (
          <div
            className="mb-5 p-3 rounded-xl text-xs"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#fbbf24",
            }}
          >
            <strong>⚠️ Connection pending</strong>
            <br />
            Supabase environment variables are not set. Configure{" "}
            <code>.env.local</code> to enable login.
          </div>
        )}

        {success ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✉️</div>
            <h2
              className="font-semibold text-base mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Check your email
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              We sent a magic link to{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {email}
              </strong>
              . Click it to sign in.
            </p>
          </div>
        ) : (
          /* Login form */
          <form onSubmit={handleSubmit} noValidate>
            <h2
              className="font-semibold text-base mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Sign in
            </h2>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Enter your email to receive a magic link.
            </p>

            <div className="mb-4">
              <label
                htmlFor="login-email"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-xs"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#f87171",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              id="login-submit-button"
              type="submit"
              className="btn-primary w-full"
              disabled={isPending || !email.trim()}
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}
      </div>

      <p
        className="mt-6 text-xs text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        Access is restricted to authorised users only.
      </p>
    </div>
  );
}
