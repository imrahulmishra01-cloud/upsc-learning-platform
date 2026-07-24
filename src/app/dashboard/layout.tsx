import type { ReactNode } from "react";

// AppShell is already included in the DashboardPage itself, so this
// layout just passes children through without a redundant shell wrapper.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
