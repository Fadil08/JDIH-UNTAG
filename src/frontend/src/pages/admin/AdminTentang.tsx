
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useTentangPage,
  useTentangPages,
  useUpdateTentangPage,
} from "../../hooks/useBackend";
import type { TentangBlock, TentangPage } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabSlug = string;

interface TabConfig {
  slug: TabSlug;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────


// ─── Helper ───────────────────────────────────────────────────────────────────

function formatUpdatedAt(ts: bigint | string | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts / 1_000_000n) : (typeof ts === 'string' ? new Date(ts).getTime() : ts);
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncatePrincipal(p: string | null | undefined): string {
  if (!p) return "—";
  if (p.length <= 20) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

// ─── Sub-editors ─────────────────────────────────────────────────────────────

interface SejarahEditorProps {
  blocks: TentangBlock[];
  onChange: (blocks: TentangBlock[]) => void;
}

function SejarahEditor({ blocks, onChange }: SejarahEditorProps) {
  const paragraphs = blocks
    .filter((b) => b.__kind__ === "paragraf")
    .map((b) => (b as { __kind__: "paragraf"; paragraf: string }).paragraf);

  const setParagraph = (idx: number, val: string) => {
    const updated = [...paragraphs];
    updated[idx] = val;
    onChange(
      updated.map((p) => ({ __kind__: "paragraf" as const, paragraf: p })),
    );
  };

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: ordered paragraphs
        <div key={idx} className="group relative">
          <label
            htmlFor={`sejarah-paragraf-${idx}`}
            className="block text-xs font-semibold text-foreground mb-1"
          >
            Paragraf {idx + 1}
          </label>
          <div className="flex gap-2">
            <textarea
              id={`sejarah-paragraf-${idx}`}
              className="flex-1 border border-input rounded-lg px-3 py-2 text-sm text-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              value={p}
              onChange={(e) => setParagraph(idx, e.target.value)}
              data-ocid={`admin_tentang.sejarah.paragraf.${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => {
                const updated = [...paragraphs];
                updated.splice(idx, 1);
                onChange(updated.map(txt => ({ __kind__: "paragraf", paragraf: txt })));
              }}
              className="text-muted-foreground hover:text-red-600 transition-colors self-start mt-2"
              aria-label="Hapus paragraf"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...blocks, { __kind__: "paragraf", paragraf: "" }]);
        }}
        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium py-1"
      >
        <Plus size={14} /> Tambah Paragraf
      </button>
    </div>
  );
}

interface VisiMisiEditorProps {
  blocks: TentangBlock[];
  onChange: (blocks: TentangBlock[]) => void;
}

function VisiMisiEditor({ blocks, onChange }: VisiMisiEditorProps) {
  const visiBlock = blocks.find((b) => b.__kind__ === "paragraf") as
    | { __kind__: "paragraf"; paragraf: string }
    | undefined;
  const misiBlock = blocks.find((b) => b.__kind__ === "daftarItem") as
    | { __kind__: "daftarItem"; daftarItem: string[] }
    | undefined;

  const visi = visiBlock?.paragraf ?? "";
  const misi = misiBlock?.daftarItem ?? [];

  const update = (newVisi: string, newMisi: string[]) => {
    onChange([
      { __kind__: "paragraf", paragraf: newVisi },
      { __kind__: "daftarItem", daftarItem: newMisi },
    ]);
  };

  const setMisiItem = (idx: number, val: string) => {
    const updated = [...misi];
    updated[idx] = val;
    update(visi, updated);
  };

  const addMisi = () => update(visi, [...misi, ""]);
  const removeMisi = (idx: number) =>
    update(
      visi,
      misi.filter((_, i) => i !== idx),
    );

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="visi-input"
          className="block text-xs font-semibold text-foreground mb-1"
        >
          Visi
        </label>
        <textarea
          id="visi-input"
          className="w-full border border-input rounded-lg px-3 py-2 text-sm text-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
          value={visi}
          onChange={(e) => update(e.target.value, misi)}
          data-ocid="admin_tentang.visi_misi.visi"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="block text-xs font-semibold text-foreground">
            Misi
          </span>
          <button
            type="button"
            onClick={addMisi}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
            data-ocid="admin_tentang.visi_misi.add_misi_button"
          >
            <Plus size={14} /> Tambah Misi
          </button>
        </div>
        <div className="space-y-2">
          {misi.map((item, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground mt-2.5 w-5 flex-shrink-0">
                {idx + 1}.
              </span>
              <input
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
                value={item}
                onChange={(e) => setMisiItem(idx, e.target.value)}
                placeholder={`Misi ${idx + 1}`}
                data-ocid={`admin_tentang.visi_misi.misi.${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeMisi(idx)}
                className="mt-2 text-muted-foreground hover:text-red-600 transition-colors"
                aria-label="Hapus misi"
                data-ocid={`admin_tentang.visi_misi.delete_misi_button.${idx + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DaftarEditorProps {
  blocks: TentangBlock[];
  onChange: (blocks: TentangBlock[]) => void;
  addLabel: string;
  placeholder: string;
  ocidPrefix: string;
}

function DaftarEditor({
  blocks,
  onChange,
  addLabel,
  placeholder,
  ocidPrefix,
}: DaftarEditorProps) {
  const daftarBlock = blocks.find((b) => b.__kind__ === "daftarItem") as
    | { __kind__: "daftarItem"; daftarItem: string[] }
    | undefined;
  const items = daftarBlock?.daftarItem ?? [];

  const update = (newItems: string[]) => {
    onChange([{ __kind__: "daftarItem", daftarItem: newItems }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Daftar Item
        </span>
        <button
          type="button"
          onClick={() => update([...items, ""])}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
          data-ocid={`${ocidPrefix}.add_button`}
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
          <div key={idx} className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground mt-2.5 w-5 flex-shrink-0">
              {idx + 1}.
            </span>
            <input
              className="flex-1 border border-input rounded-lg px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
              value={item}
              onChange={(e) => {
                const updated = [...items];
                updated[idx] = e.target.value;
                update(updated);
              }}
              placeholder={placeholder}
              data-ocid={`${ocidPrefix}.item.${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => update(items.filter((_, i) => i !== idx))}
              className="mt-2 text-muted-foreground hover:text-red-600 transition-colors"
              aria-label="Hapus item"
              data-ocid={`${ocidPrefix}.delete_button.${idx + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StrukturEditorProps {
  blocks: TentangBlock[];
  onChange: (blocks: TentangBlock[]) => void;
}

function StrukturEditor({ blocks, onChange }: StrukturEditorProps) {
  const daftarBlock = blocks.find((b) => b.__kind__ === "daftarItem") as
    | { __kind__: "daftarItem"; daftarItem: string[] }
    | undefined;
  const rawItems = daftarBlock?.daftarItem ?? [];

  // Parse "Jabatan: X | Nama: Y | Unit: Z"
  const parseItem = (raw: string) => {
    const parts: Record<string, string> = {};
    for (const seg of raw.split(" | ")) {
      const [k, ...rest] = seg.split(": ");
      if (k && rest.length) parts[k.trim()] = rest.join(": ").trim();
    }
    return {
      jabatan: parts.Jabatan ?? "",
      nama: parts.Nama ?? "",
      unit: parts.Unit ?? "",
    };
  };

  const serializeItem = (jabatan: string, nama: string, unit: string) =>
    `Jabatan: ${jabatan} | Nama: ${nama} | Unit: ${unit}`;

  const members = rawItems.map(parseItem);

  const update = (
    idx: number,
    field: "jabatan" | "nama" | "unit",
    val: string,
  ) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange([
      {
        __kind__: "daftarItem",
        daftarItem: updated.map((m) =>
          serializeItem(m.jabatan, m.nama, m.unit),
        ),
      },
    ]);
  };

  const addMember = () => {
    onChange([
      {
        __kind__: "daftarItem",
        daftarItem: [...rawItems, serializeItem("", "", "")],
      },
    ]);
  };

  const removeMember = (idx: number) => {
    onChange([
      {
        __kind__: "daftarItem",
        daftarItem: rawItems.filter((_, i) => i !== idx),
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Anggota Struktur
        </span>
        <button
          type="button"
          onClick={addMember}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
          data-ocid="admin_tentang.struktur.add_button"
        >
          <Plus size={14} /> Tambah Anggota
        </button>
      </div>
      <div className="space-y-3">
        {members.map((m, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: ordered list, never reordered in-place
          <div
            key={idx}
            className="border border-border rounded-lg p-3 bg-background space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Anggota {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeMember(idx)}
                className="text-muted-foreground hover:text-red-600 transition-colors"
                aria-label="Hapus anggota"
                data-ocid={`admin_tentang.struktur.delete_button.${idx + 1}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor={`jabatan-${idx}`}
                  className="text-xs text-muted-foreground"
                >
                  Jabatan
                </label>
                <input
                  id={`jabatan-${idx}`}
                  className="w-full border border-input rounded-md px-2 py-1.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500 mt-0.5"
                  value={m.jabatan}
                  onChange={(e) => update(idx, "jabatan", e.target.value)}
                  placeholder="Jabatan"
                  data-ocid={`admin_tentang.struktur.jabatan.${idx + 1}`}
                />
              </div>
              <div>
                <label
                  htmlFor={`nama-${idx}`}
                  className="text-xs text-muted-foreground"
                >
                  Nama
                </label>
                <input
                  id={`nama-${idx}`}
                  className="w-full border border-input rounded-md px-2 py-1.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500 mt-0.5"
                  value={m.nama}
                  onChange={(e) => update(idx, "nama", e.target.value)}
                  placeholder="Nama lengkap"
                  data-ocid={`admin_tentang.struktur.nama.${idx + 1}`}
                />
              </div>
              <div>
                <label
                  htmlFor={`unit-${idx}`}
                  className="text-xs text-muted-foreground"
                >
                  Unit
                </label>
                <input
                  id={`unit-${idx}`}
                  className="w-full border border-input rounded-md px-2 py-1.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500 mt-0.5"
                  value={m.unit}
                  onChange={(e) => update(idx, "unit", e.target.value)}
                  placeholder="Unit / Jabatan Struktural"
                  data-ocid={`admin_tentang.struktur.unit.${idx + 1}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  slug: TabSlug;
}

function TabPanel({ slug }: TabPanelProps) {
  const { data: page, isLoading } = useTentangPage(slug);
  const [judul, setJudul] = useState("");
  const [blocks, setBlocks] = useState<TentangBlock[]>([]);

  // Sync when backend data loads
  useEffect(() => {
    if (page) {
      setJudul(page.judul);
      setBlocks(page.konten?.blocks ?? []);
    }
  }, [page]);

  const mutation = useUpdateTentangPage();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 size={18} className="animate-spin text-red-600" />
        Memuat konten halaman...
      </div>
    );
  }


  const handleSave = () => {
    mutation.mutate(
      { slug, input: { judul, konten: { blocks } } },
      {
        onSuccess: () => toast.success("Konten berhasil disimpan!"),
        onError: (e) =>
          toast.error(
            `Gagal menyimpan: ${e instanceof Error ? e.message : "Kesalahan tidak diketahui"}`,
          ),
      },
    );
  };

  return (
    <div className="space-y-6" data-ocid={`admin_tentang.${slug}.panel`}>
      {/* Meta info */}
      {page && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> Terakhir diperbarui:{" "}
            {formatUpdatedAt(page.updatedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            oleh{" "}
            <span className="font-mono font-medium text-foreground">
              {truncatePrincipal(page.updatedBy ? String(page.updatedBy) : null)}
            </span>
          </span>
        </div>
      )}

      {/* Judul halaman */}
      <div>
        <label
          htmlFor={`judul-${slug}`}
          className="block text-xs font-semibold text-foreground mb-1"
        >
          Judul Halaman
        </label>
        <input
          id={`judul-${slug}`}
          className="w-full border border-input rounded-lg px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul halaman"
          data-ocid={`admin_tentang.${slug}.judul`}
        />
      </div>

      {/* Content editor */}
      <div className="border border-border rounded-xl bg-card p-5">
        {slug === "sejarah" && (
          <SejarahEditor blocks={blocks} onChange={setBlocks} />
        )}
        {slug === "visiMisi" && (
          <VisiMisiEditor blocks={blocks} onChange={setBlocks} />
        )}
        {slug === "dasarHukum" && (
          <DaftarEditor
            blocks={blocks}
            onChange={setBlocks}
            addLabel="Tambah Regulasi"
            placeholder="Contoh: Peraturan Presiden Nomor 33 Tahun 2012..."
            ocidPrefix="admin_tentang.dasar_hukum"
          />
        )}
        {slug === "fungsi" && (
          <DaftarEditor
            blocks={blocks}
            onChange={setBlocks}
            addLabel="Tambah Fungsi"
            placeholder="Contoh: Mendokumentasikan seluruh produk hukum..."
            ocidPrefix="admin_tentang.fungsi"
          />
        )}
        {slug === "struktur" && (
          <StrukturEditor blocks={blocks} onChange={setBlocks} />
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {mutation.isSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 size={14} /> Tersimpan
          </span>
        )}
        {mutation.isError && (
          <span className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle size={14} /> Gagal menyimpan
          </span>
        )}
        {!mutation.isSuccess && !mutation.isError && <span />}
        <button
          type="button"
          onClick={handleSave}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          data-ocid={`admin_tentang.${slug}.save_button`}
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminTentang() {
  const { data: pages, isLoading } = useTentangPages();
  const [activeTab, setActiveTab] = useState<TabSlug>("sejarah");

  useEffect(() => {
    if (pages && pages.length > 0 && activeTab === "sejarah" && !pages.find(p => p.slug === "sejarah")) {
      setActiveTab(pages[0].slug);
    }
  }, [pages]);

  const getPage = (slug: TabSlug): TentangPage | null => {
    if (!pages) return null;
    const found = pages.find((p) => {
      // backend TentangSlug enum value matches slug string
      const slugKey = String(p.slug);
      return (
        slugKey === slug ||
        (p as unknown as { slug: { __kind__?: string } }).slug.__kind__ === slug
      );
    });
    return found ?? null;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" data-ocid="admin_tentang.page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-red-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Kelola Tentang JDIH
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit konten halaman publik "Tentang JDIH" — perubahan langsung
            tersimpan ke database
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Tab bar */}
        <div
          className="flex overflow-x-auto border-b border-border bg-muted/30"
          role="tablist"
        >
          {pages?.map((p) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-selected={activeTab === p.slug}
              onClick={() => setActiveTab(p.slug)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === p.slug
                  ? "border-red-600 text-red-700 bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-ocid={`admin_tentang.tab.${p.slug}`}
            >
              {p.judul.replace(" JDIH UNTAG Banyuwangi", "").replace(" JDIH", "")}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          <TabPanel
            key={activeTab}
            slug={activeTab}
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <p>
          <strong>Tips:</strong> Setiap tab menyimpan secara terpisah. Klik
          "Simpan Perubahan" di setiap tab untuk menyimpan konten halaman
          tersebut. Konten yang disimpan langsung tampil di halaman publik.
        </p>
      </div>
    </div>
  );
}
