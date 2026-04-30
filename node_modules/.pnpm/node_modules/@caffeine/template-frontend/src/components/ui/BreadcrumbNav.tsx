import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className}`}
      data-ocid="breadcrumb"
    >
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Beranda</span>
      </Link>
      {items.map((item, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: breadcrumb items are positional
        <span key={idx} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
          {item.to && idx < items.length - 1 ? (
            <Link
              to={item.to}
              className="text-muted-foreground hover:text-foreground transition-smooth max-w-[180px] truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-foreground font-medium max-w-[200px] truncate"
              aria-current={idx === items.length - 1 ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
