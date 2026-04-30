import type { ReactNode } from "react";
import { type BreadcrumbItem, BreadcrumbNav } from "./BreadcrumbNav";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`bg-card border-b border-border ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-3">
            <BreadcrumbNav items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground text-sm mt-1 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
