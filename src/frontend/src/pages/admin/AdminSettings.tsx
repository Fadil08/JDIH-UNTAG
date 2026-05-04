import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Save, Upload, X, Settings as SettingsIcon } from "lucide-react";

import { api, API_BASE } from "../../api";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function AdminSettings() {
  const qc = useQueryClient();
  const { can } = usePermissions();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const [form, setForm] = useState({
    app_name: "",
    unit_name: "",
    app_description: "",
    contact_email: "",
    contact_phone: "",
    logo: null as File | null,
  });

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        app_name: settings.app_name || "",
        unit_name: settings.unit_name || "",
        app_description: settings.app_description || "",
        contact_email: settings.contact_email || "",
        contact_phone: settings.contact_phone || "",
        logo: null,
      });
      setPreviewLogo(settings.logo_url ? (settings.logo_url.startsWith('http') ? settings.logo_url : API_BASE + settings.logo_url) : null);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: (data: typeof form) => api.settings.update(data),
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    },
  });

  if (!can("settings:view")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg font-bold text-destructive">Akses Ditolak</p>
        <p className="text-muted-foreground text-sm">
          Anda tidak memiliki izin untuk melihat pengaturan sistem.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(form);
  };

  const isEditing = can("settings:edit");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground leading-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground text-sm">
            Sesuaikan identitas, kontak, dan logo aplikasi JDIH Anda.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Identitas Website</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Nama Aplikasi / Judul Website</Label>
                  <Input 
                    value={form.app_name}
                    onChange={(e) => setForm(f => ({ ...f, app_name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nama Unit Kerja</Label>
                  <Input 
                    value={form.unit_name}
                    onChange={(e) => setForm(f => ({ ...f, unit_name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Deskripsi Singkat (Footer)</Label>
                  <Textarea 
                    value={form.app_description}
                    onChange={(e) => setForm(f => ({ ...f, app_description: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1 resize-none h-24"
                  />
                </div>
              </div>

              <div>
                <Label>Logo Sistem</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/20 min-h-[160px] relative">
                  {previewLogo ? (
                    <>
                      <img src={previewLogo} alt="Logo" className="max-h-[120px] object-contain" />
                      {isEditing && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 w-7 h-7 rounded-full"
                          onClick={() => {
                            setPreviewLogo(null);
                            setForm(f => ({ ...f, logo: null }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">Belum ada logo terpasang</p>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                        {previewLogo ? "Ganti Logo" : "Pilih Logo"}
                      </Button>
                      <input 
                        type="file" 
                        ref={fileRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setForm(f => ({ ...f, logo: file }));
                            setPreviewLogo(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Informasi Kontak</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Email</Label>
                <Input 
                  value={form.contact_email}
                  onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nomor Telepon</Label>
                <Input 
                  value={form.contact_phone}
                  onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave} 
                disabled={updateSettings.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]"
              >
                {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
