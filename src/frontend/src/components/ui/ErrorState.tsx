import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data. Silakan coba lagi.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
      data-ocid="error_state"
    >
      <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-display font-semibold text-foreground text-lg mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-6 gap-2 border-border"
          data-ocid="error_state.retry_button"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
