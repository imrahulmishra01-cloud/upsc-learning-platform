"use client";

import { useState } from "react";
import type { StudyPlan } from "@/lib/db/types";
import PlanCard from "./PlanCard";

interface PlansClientProps {
  initialPlans: StudyPlan[];
}

export default function PlansClient({ initialPlans }: PlansClientProps) {
  const [plans, setPlans] = useState(initialPlans);

  // When one plan is activated, optimistically demote all other active plans to "paused"
  // so their badges update immediately without a full page reload.
  const handleActivated = (activatedId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === activatedId) return { ...p, status: "active" };
        if (p.status === "active")  return { ...p, status: "paused" };
        return p;
      })
    );
  };

  if (plans.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 fade-in">
      <p className="section-title">Your Plans</p>
      {plans.map((p) => (
        <PlanCard key={p.id} plan={p} onActivated={handleActivated} />
      ))}
    </div>
  );
}
