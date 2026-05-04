import { Loader2, Scale } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api, { API_BASE } from "../../api";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const SPINNER_SIZE_MAP = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const LOGO_SIZE_MAP = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
};

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
    staleTime: 5 * 60 * 1000,
  });

  const logoUrl = settings?.logo_url 
    ? (settings.logo_url.startsWith('http') ? settings.logo_url : API_BASE + settings.logo_url)
    : null;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      data-ocid="loading_state"
    >
      <div className={`relative flex items-center justify-center ${SPINNER_SIZE_MAP[size]}`}>
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        
        {/* Inner logo pulsing */}
        <div className={`flex items-center justify-center animate-pulse bg-white rounded-full ${LOGO_SIZE_MAP[size]}`}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
          ) : (
            <Scale className="w-full h-full text-accent p-1" />
          )}
        </div>
      </div>
      {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
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
