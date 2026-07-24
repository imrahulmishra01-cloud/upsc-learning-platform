interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({ icon = "🔧", title, description, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}
    >
      <span className="text-4xl mb-3 opacity-60">{icon}</span>
      <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
