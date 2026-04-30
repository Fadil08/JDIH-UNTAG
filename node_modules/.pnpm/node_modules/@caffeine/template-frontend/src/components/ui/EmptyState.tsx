import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
      data-ocid="empty_state"
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
        {icon ?? <FolderOpen className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="font-display font-semibold text-foreground text-lg mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
          data-ocid="empty_state.action_button"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
