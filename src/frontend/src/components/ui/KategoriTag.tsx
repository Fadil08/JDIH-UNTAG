import { Badge } from "@/components/ui/badge";

interface KategoriTagProps {
  nama: string;
  className?: string;
  onClick?: () => void;
}

export function KategoriTag({
  nama,
  className = "",
  onClick,
}: KategoriTagProps) {
  return (
    <Badge
      variant="secondary"
      onClick={onClick}
      className={`text-xs font-medium bg-secondary text-secondary-foreground border border-border cursor-${onClick ? "pointer" : "default"} hover:bg-secondary/80 transition-smooth ${className}`}
    >
      {nama}
    </Badge>
  );
}
