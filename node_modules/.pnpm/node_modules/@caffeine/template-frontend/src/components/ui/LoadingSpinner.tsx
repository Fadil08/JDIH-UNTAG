import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      data-ocid="loading_state"
    >
      <Loader2 className={`${SIZE_MAP[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-3 animate-pulse">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton h-9 w-28 rounded mt-2" />
    </div>
  );
}

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

export function SkeletonList({ count = 5 }: { count?: number }) {
  const items = SKELETON_KEYS.slice(0, count);
  return (
    <div className="space-y-3" data-ocid="loading_state">
      {items.map((key) => (
        <div
          key={key}
          className="bg-card border border-border rounded-lg p-4 animate-pulse flex gap-4"
        >
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-full" />
          </div>
          <div className="skeleton h-9 w-24 rounded flex-shrink-0 self-center" />
        </div>
      ))}
    </div>
  );
}
