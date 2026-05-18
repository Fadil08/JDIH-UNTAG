import {
  AlertCircle,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useKontakInfo, useUpdateKontakInfo } from "../../hooks/useBackend";
import type { KontakInfo } from "../../types";

const ICON_OPTIONS = [
  { value: "MapPin", label: "Lokasi", icon: MapPin },
  { value: "Phone", label: "Telepon", icon: Phone },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "Clock", label: "Waktu", icon: Clock },
];

export function AdminKontak() {
  const { data: initialData, isLoading } = useKontakInfo();
  const [items, setItems] = useState<KontakInfo[]>([]);
  const mutation = useUpdateKontakInfo();

  useEffect(() => {
    if (initialData) {
      setItems(initialData);
    }
  }, [initialData]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { label: "", value: "", deskripsi: "", icon: "MapPin", urutan: items.length },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof KontakInfo, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleSave = () => {
    mutation.mutate(items, {
      onSuccess: () => toast.success("Informasi kontak berhasil diperbarui"),
      onError: (err) => toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Memuat data kontak...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" data-ocid="admin_kontak.page">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
            <Phone className="w-6 h-6 text-red-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Kelola Informasi Kontak</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Atur informasi alamat, telepon, email, dan jam operasional</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
          data-ocid="admin_kontak.save_button"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Perubahan
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-red-200 transition-colors"
            data-ocid={`admin_kontak.item.${idx}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ikon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleChange(idx, "icon", opt.value)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        item.icon === opt.value
                          ? "bg-red-50 border-red-200 text-red-600 ring-2 ring-red-500/10"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                      title={opt.label}
                    >
                      <opt.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleChange(idx, "label", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    placeholder="Contoh: Alamat"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Keterangan</label>
                  <input
                    type="text"
                    value={item.deskripsi || ""}
                    onChange={(e) => handleChange(idx, "deskripsi", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all"
                    placeholder="Contoh: Jam kerja Senin-Jumat"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Nilai / Isi</label>
                  <textarea
                    value={item.value}
                    onChange={(e) => handleChange(idx, "value", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none"
                    rows={2}
                    placeholder="Contoh: Jl. Adi Sucipto No. 26..."
                  />
                </div>
              </div>

              <button
                onClick={() => handleRemoveItem(idx)}
                className="mt-6 p-2.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Hapus Item"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddItem}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all font-medium text-sm group"
        >
          <div className="w-8 h-8 bg-muted group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
            <Plus size={18} />
          </div>
          Tambah Informasi Kontak Baru
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Perhatian</p>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            Perubahan pada informasi kontak akan langsung berdampak pada halaman publik "Kontak Kami" dan bagian footer website. Pastikan informasi yang dimasukkan sudah benar.
          </p>
        </div>
      </div>
    </div>
  );
}
