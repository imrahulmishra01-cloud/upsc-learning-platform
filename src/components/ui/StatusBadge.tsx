export type StatusVariant = "connected" | "pending" | "error" | "not-configured";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

const STATUS_CONFIG: Record<StatusVariant, { dot: string; label: string; className: string }> = {
  connected: {
    dot: "bg-green-400",
    label: "Connected",
    className: "badge badge-connected",
  },
  pending: {
    dot: "bg-yellow-400",
    label: "Connection pending",
    className: "badge badge-pending",
  },
  error: {
    dot: "bg-red-400",
    label: "Error",
    className: "badge badge-error",
  },
  "not-configured": {
    dot: "bg-slate-500",
    label: "Not configured",
    className: "badge badge-not-configured",
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={config.className}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${config.dot}`} />
      {label ?? config.label}
    </span>
  );
}
