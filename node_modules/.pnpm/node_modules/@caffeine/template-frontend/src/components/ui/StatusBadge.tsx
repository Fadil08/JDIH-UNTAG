import { Badge } from "@/components/ui/badge";
import type { StatusDokumen, WorkflowStatus } from "../../types";
import { useStatus } from "../../hooks/useBackend";
import { STATUS_LABEL, WORKFLOW_STATUS_LABEL } from "../../types";

// ─── StatusBadge (Berlaku / TidakBerlaku / Dicabut) ──────────────────────────

interface StatusBadgeProps {
  status: StatusDokumen;
  className?: string;
}

const STATUS_STYLES: Partial<Record<StatusDokumen, string>> = {
  Berlaku:
    "bg-foreground/5 text-foreground border border-border hover:bg-foreground/5",
  "Tidak Berlaku":
    "bg-muted text-muted-foreground border border-border hover:bg-muted",
  Dicabut:
    "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { data: statusList } = useStatus();
  
  const item = statusList?.find(s => s.nama === status);
  if (item && item.warna) {
    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium px-2 py-0.5 ${className}`}
        style={{ 
          backgroundColor: `${item.warna}1a`, 
          color: item.warna, 
          borderColor: `${item.warna}4d` 
        }}
      >
        {item.nama}
      </Badge>
    );
  }

  const style = STATUS_STYLES[status] || "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80";
  return (
    <Badge
      variant="outline"
      className={`${style} text-xs font-medium px-2 py-0.5 ${className}`}
    >
      {STATUS_LABEL[status] || status}
    </Badge>
  );
}

// ─── WorkflowStatusBadge (Draft / PendingReview / Published) ─────────────────

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

const WORKFLOW_STYLES: Record<WorkflowStatus, string> = {
  Draft: "bg-muted text-muted-foreground border border-border hover:bg-muted",
  PendingReview:
    "bg-yellow-50 text-yellow-800 border border-yellow-300 hover:bg-yellow-50",
  Published:
    "bg-green-50 text-green-800 border border-green-300 hover:bg-green-50",
  Archived:
    "bg-foreground/20 text-foreground border border-border hover:bg-foreground/20",
};

export function WorkflowStatusBadge({
  status,
  className = "",
}: WorkflowStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${WORKFLOW_STYLES[status]} text-xs font-medium px-2 py-0.5 ${className}`}
    >
      {WORKFLOW_STATUS_LABEL[status]}
    </Badge>
  );
}
