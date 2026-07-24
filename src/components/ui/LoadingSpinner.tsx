interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full border-white/10 border-t-green-400 animate-spin`}
      />
      {label && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
      )}
    </div>
  );
}
