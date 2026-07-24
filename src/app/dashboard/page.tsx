import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getDashboardCounts } from "@/lib/db/planner";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const counts = await getDashboardCounts();

  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  interface CardDef {
    id: string;
    icon: string;
    title: string;
    href?: string;
  }

  const CARDS: CardDef[] = [
    { id: "todays-tasks",       icon: "✅", title: "Today's Tasks",      href: "/planner/tasks" },
    { id: "revision-due",       icon: "🔁", title: "Revision Due",       href: "/planner" },
    { id: "pyqs-due",           icon: "📋", title: "PYQs Due",           href: "/pyq" },
    { id: "current-affairs-due",icon: "📰", title: "Current Affairs",    href: "/current-affairs" },
    { id: "tests",              icon: "🧪", title: "Tests",              href: "/tests" },
    { id: "ai-usage",           icon: "🤖", title: "AI Usage",           href: "/ai/evaluate" },
    { id: "material-vault",     icon: "🗄️", title: "Material Vault",     href: "/materials" },
    { id: "progress",           icon: "📈", title: "Progress",           href: "/reports" },
  ];

  function getCountForCard(id: string): number | null {
    switch (id) {
      case "todays-tasks": return counts.todayTasksPending;
      case "revision-due": return counts.revisionDue;
      case "pyqs-due": return counts.pyqsDue;
      case "current-affairs-due": return counts.caRevisionDue;
      case "tests": return counts.testsPending;
      case "ai-usage": return counts.aiUsedToday;
      case "material-vault": return counts.activeMaterials;
      case "progress": return counts.avgTopicProgress;
      default: return null;
    }
  }

  function renderCount(card: CardDef) {
    const val = getCountForCard(card.id);
    if (val === null) return "Unavailable";

    switch (card.id) {
      case "todays-tasks":
        return val > 0 ? `${val} pending today` : "All clear today";
      case "revision-due":
        return val > 0 ? `${val} due for review` : "No revisions due";
      case "pyqs-due":
        return val > 0 ? `${val} PYQs marked for revision` : "No PYQs due";
      case "current-affairs-due":
        return val > 0 ? `${val} entries due for revision` : "All caught up";
      case "tests":
        return val > 0 ? `${val} test sessions pending` : "No active tests";
      case "ai-usage":
        return `${val} / ${counts.aiDailyLimit ?? "—"} calls today`;
      case "material-vault":
        return val > 0 ? `${val} private materials` : "Ready (Private material library)";
      case "progress":
        return val > 0 ? `${val}% avg topic coverage` : "No progress logged yet";
      default:
        return "—";
    }
  }

  function renderBadge(card: CardDef) {
    const val = getCountForCard(card.id);
    if (val === null) {
      return (
        <span className="badge badge-not-configured flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
          Unavailable
        </span>
      );
    }

    if (card.id === "ai-usage" || card.id === "progress" || card.id === "material-vault") {
       return (
        <span className="badge badge-connected flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Active
        </span>
      );
    }

    if (val > 0) {
      return (
        <span className="badge badge-pending flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
          {val}
        </span>
      );
    }

    return (
      <span className="badge badge-connected flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
        ✓
      </span>
    );
  }

  return (
    <AppShell title="Dashboard">
      {/* Greeting */}
      <div className="mb-5 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Good day, Aspirant 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{now}</p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 fade-in">
        {CARDS.map((card) => {
          const countText = renderCount(card);
          const badge = renderBadge(card);
          const isClickable = !!card.href;

          const inner = (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{card.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2
                    className="font-semibold text-sm leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {card.title}
                  </h2>
                  {badge}
                </div>
                <p
                  className="text-xs mt-1.5 leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {countText}
                </p>
              </div>
            </div>
          );

          return isClickable ? (
            <Link
              key={card.id}
              id={`card-${card.id}`}
              href={card.href!}
              className="upsc-card no-underline block"
            >
              {inner}
            </Link>
          ) : (
            <div key={card.id} id={`card-${card.id}`} className="upsc-card">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Active Workflow Notice */}
      <div
        className="mt-6 p-4 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(34, 197, 94, 0.06)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "#4ade80" }}>Core learning workflow active:</strong>{" "}
        planning, materials, current affairs, PYQ practice, tests, revision, reports, and AI-assisted evaluation.
      </div>
    </AppShell>
  );
}

