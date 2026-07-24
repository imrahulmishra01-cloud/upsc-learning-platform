import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import EvaluateForm from "./EvaluateForm";

export const metadata: Metadata = { title: "AI Answer Evaluation" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AiEvaluatePage() {
  const supabase = await createClient();
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  let recentSubmissions: { id: string; session_type: string; evaluation_status: string; submitted_at: string; marks_awarded: number | null; max_marks: number | null }[] = [];
  let aiUsage = { used_today: 0, daily_limit: 10 };
  let migrationPending = false;

  if (supabase) {
    try {
      const { data: subs, error } = await supabase
        .from("answer_submissions")
        .select("id, session_type, evaluation_status, submitted_at, marks_awarded, max_marks")
        .order("submitted_at", { ascending: false })
        .limit(5);

      if (error?.code === "42P01") {
        migrationPending = true;
      } else if (subs) {
        recentSubmissions = subs;
      }

      const { data: limitRow } = await supabase
        .from("ai_usage_limits")
        .select("daily_limit, used_today")
        .single();
      if (limitRow) aiUsage = limitRow;
    } catch {
      migrationPending = true;
    }
  }

  return (
    <AppShell title="AI Evaluation">
      <Link href="/tests" className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in" style={{ color: "var(--color-text-muted)" }}>
        ← Tests
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        AI Answer Evaluation
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Paste your answer for AI-powered UPSC examiner feedback. Powered by Google Gemini.
      </p>

      {/* Usage Meter */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Today&apos;s AI Usage</p>
          <span className={`badge ${aiUsage.used_today >= aiUsage.daily_limit ? "badge-not-configured" : "badge-connected"}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${aiUsage.used_today >= aiUsage.daily_limit ? "bg-red-400" : "bg-green-400"}`} />
            {aiUsage.used_today} / {aiUsage.daily_limit}
          </span>
        </div>
        <div className="w-full bg-gray-700/30 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min((aiUsage.used_today / aiUsage.daily_limit) * 100, 100)}%`,
              background: aiUsage.used_today >= aiUsage.daily_limit ? "var(--color-error, #ef4444)" : "var(--color-brand)",
            }}
          />
        </div>
        {!geminiConfigured && (
          <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
            ⚠ GEMINI_API_KEY not configured. Add to .env.local to enable AI evaluation.
          </p>
        )}
      </div>

      {/* Evaluation Form */}
      {migrationPending ? (
        <div className="upsc-card fade-in" style={{ borderColor: "rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.05)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#fbbf24" }}>Migration Pending</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Apply <code>supabase/migrations/20240005_required_reading_matrix.sql</code> to enable AI submission tracking.
          </p>
        </div>
      ) : (
        <EvaluateForm geminiConfigured={geminiConfigured} dailyLimitReached={aiUsage.used_today >= aiUsage.daily_limit} />
      )}

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div className="mt-6 fade-in">
          <p className="section-title">Recent Evaluations</p>
          <div className="space-y-2">
            {recentSubmissions.map((sub) => (
              <div key={sub.id} className="upsc-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {sub.session_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(sub.submitted_at).toLocaleDateString("en-IN")}
                      {sub.marks_awarded != null && sub.max_marks != null && ` · ${sub.marks_awarded}/${sub.max_marks}`}
                    </p>
                  </div>
                  <span className={`badge ${
                    sub.evaluation_status === "done" ? "badge-connected" :
                    sub.evaluation_status === "pending" || sub.evaluation_status === "processing" ? "badge-pending" :
                    "badge-not-configured"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                      sub.evaluation_status === "done" ? "bg-green-400" :
                      sub.evaluation_status === "pending" || sub.evaluation_status === "processing" ? "bg-yellow-400" :
                      "bg-slate-500"
                    }`} />
                    {sub.evaluation_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
