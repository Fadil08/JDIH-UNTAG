import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatTanggalIndonesia(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}
