import { type ReactNode } from "react";

interface CardProps {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  className?: string;
  /** If true, the card gets a subtle brand-coloured top border */
  accent?: boolean;
}

export default function Card({ icon, title, children, className = "", accent = false }: CardProps) {
  return (
    <div
      className={`upsc-card ${accent ? "border-t-brand-500" : ""} ${className}`}
      style={accent ? { borderTopColor: "var(--color-brand)", borderTopWidth: "2px" } : {}}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h3>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
