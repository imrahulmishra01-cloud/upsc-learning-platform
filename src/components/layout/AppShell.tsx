import { type ReactNode } from "react";
import MobileNav from "./MobileNav";
import AppHeader from "./AppHeader";

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="app-shell">
      <AppHeader title={title} />
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
