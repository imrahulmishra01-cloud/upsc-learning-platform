import SignOutButton from "./SignOutButton";

interface AppHeaderProps {
  title?: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full flex items-center justify-between px-4"
      style={{
        height: "var(--header-height)",
        background: "rgba(15, 17, 23, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg">📚</span>
        <span
          className="font-semibold text-sm tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title ?? "UPSC Prep"}
        </span>
      </div>

      {/* User actions */}
      <SignOutButton />
    </header>
  );
}
