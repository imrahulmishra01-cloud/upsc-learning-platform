import type { ReactNode } from "react";

// AppShell is included in each page directly.
export default function RevisionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
