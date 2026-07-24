import { type ReactNode } from "react";

/** Pass-through layout — AppShell is rendered per page, not here. */
export default function CurrentAffairsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
