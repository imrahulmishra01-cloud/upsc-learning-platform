import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comprehensive Reports" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <AppShell title="Reports">
        <p className="text-sm text-red-500">Database not configured.</p>
      </AppShell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AppShell title="Reports">Unauthorized</AppShell>;

  // Fetch parallel data (gracefully handle missing tables)
  const [
    tasksRes,
    caRes,
    pyqRes,
    csatRes,
    testsRes,
    revisionRes
  ] = await Promise.allSettled([
    supabase.from("daily_tasks").select("status, actual_minutes").eq("user_id", user.id),
    supabase.from("current_affairs_entries").select("status, gs_papers").eq("user_id", user.id),
    supabase.from("pyq_attempts").select("status, mistake_type, self_score").eq("user_id", user.id),
    supabase.from("csat_sessions").select("questions_attempted, questions_correct, score_pct").eq("user_id", user.id),
    supabase.from("test_sessions").select("status, score_pct").eq("user_id", user.id),
    supabase.from("revision_tasks").select("completed_at").eq("user_id", user.id)
  ]);

  // Daily Tasks
  const tasks = tasksRes.status === "fulfilled" ? (tasksRes.value.data || []) : [];
  const tasksCompleted = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  const studyTimeMin = tasks.reduce((acc, t) => acc + (t.actual_minutes || 0), 0);

  // Current Affairs
  const ca = caRes.status === "fulfilled" ? (caRes.value.data || []) : [];
  const caRead = ca.filter(c => c.status === "read" || c.status === "noted" || c.status === "revised").length;
  
  // GS Coverage from CA
  const gsCoverage: Record<string, number> = {};
  ca.forEach(item => {
    if (item.gs_papers) {
      item.gs_papers.forEach((gs: string) => {
        gsCoverage[gs] = (gsCoverage[gs] || 0) + 1;
      });
    }
  });

  // PYQ Practice
  const pyqs = pyqRes.status === "fulfilled" ? (pyqRes.value.data || []) : [];
  const pyqAttempted = pyqs.length;
  const mistakes: Record<string, number> = {};
  pyqs.forEach(p => {
    if (p.mistake_type && p.mistake_type !== "none") {
      mistakes[p.mistake_type] = (mistakes[p.mistake_type] || 0) + 1;
    }
  });

  // CSAT Accuracy
  const csat = csatRes.status === "fulfilled" ? (csatRes.value.data || []) : [];
  let csatAttempted = 0, csatCorrect = 0;
  csat.forEach(c => {
    csatAttempted += (c.questions_attempted || 0);
    csatCorrect += (c.questions_correct || 0);
  });
  const csatAccuracy = csatAttempted > 0 ? Math.round((csatCorrect / csatAttempted) * 100) : 0;

  // Test Scores
  const tests = testsRes.status === "fulfilled" ? (testsRes.value.data || []) : [];
  const validTests = tests.filter(t => t.score_pct != null);
  const avgTestScore = validTests.length > 0 
    ? Math.round(validTests.reduce((acc, t) => acc + t.score_pct!, 0) / validTests.length) 
    : 0;

  // Revisions
  const revisions = revisionRes.status === "fulfilled" ? (revisionRes.value.data || []) : [];
  const revCompleted = revisions.filter(r => r.completed_at != null).length;

  return (
    <AppShell title="Comprehensive Reports">
      <div className="mb-6 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Performance Reports
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          All-time statistics across all modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
        
        {/* Productivity & Tasks */}
        <div className="upsc-card p-4">
          <h2 className="text-sm font-semibold mb-3 border-b pb-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
            Productivity & Tasks
          </h2>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">Study Time Logged</span>
            <span className="text-sm font-medium">{Math.floor(studyTimeMin / 60)}h {studyTimeMin % 60}m</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">Tasks Completed</span>
            <span className="text-sm font-medium">{tasksCompleted} / {totalTasks}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">Revisions Completed</span>
            <span className="text-sm font-medium">{revCompleted} / {revisions.length}</span>
          </div>
        </div>

        {/* Practice & Accuracy */}
        <div className="upsc-card p-4">
          <h2 className="text-sm font-semibold mb-3 border-b pb-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
            Practice & Accuracy
          </h2>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">PYQs Attempted</span>
            <span className="text-sm font-medium">{pyqAttempted}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">Avg Test Score</span>
            <span className="text-sm font-medium">{avgTestScore}%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">CSAT Accuracy</span>
            <span className="text-sm font-medium">{csatAccuracy}%</span>
          </div>
        </div>

        {/* Subject Coverage */}
        <div className="upsc-card p-4">
          <h2 className="text-sm font-semibold mb-3 border-b pb-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
            Subject Coverage (Current Affairs)
          </h2>
          <div className="flex justify-between py-1">
            <span className="text-xs text-muted">Articles Covered</span>
            <span className="text-sm font-medium">{caRead} / {ca.length}</span>
          </div>
          {Object.entries(gsCoverage).length > 0 ? (
            <div className="mt-2 space-y-1">
              {Object.entries(gsCoverage).map(([gs, count]) => (
                <div key={gs} className="flex justify-between py-0.5">
                  <span className="text-xs pl-2" style={{ color: "var(--color-text-secondary)" }}>• {gs}</span>
                  <span className="text-xs">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>No GS mapping data yet.</p>
          )}
        </div>

        {/* Mistake Analysis */}
        <div className="upsc-card p-4">
          <h2 className="text-sm font-semibold mb-3 border-b pb-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
            PYQ Mistake Analysis
          </h2>
          {Object.entries(mistakes).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(mistakes).map(([type, count]) => (
                <div key={type} className="flex justify-between py-1">
                  <span className="text-xs capitalize" style={{ color: "var(--color-text-secondary)" }}>{type.replace("_", " ")}</span>
                  <span className="badge badge-pending text-[10px]">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>No mistakes tracked yet.</p>
          )}
        </div>

      </div>
    </AppShell>
  );
}
