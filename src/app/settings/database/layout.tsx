import type { ReactNode } from "react";

// Settings sub-pages use the same passthrough layout as the parent.
export default function SettingsSubLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
