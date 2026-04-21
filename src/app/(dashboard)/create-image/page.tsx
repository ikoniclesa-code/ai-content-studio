"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Download,
  X,
  Sparkles,
  ArrowLeft,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { FormField } from "@/components/ui/FormField";
import { RetryError } from "@/components/ui/RetryError";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { generateImageSchema } from "@/lib/validations";
import { CREDIT_COSTS } from "@/constants/plans";
import type { Brand } from "@/types/database";

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Instagram)" },
  { value: "16:9", label: "16:9 (Facebook)" },
  { value: "9:16", label: "9:16 (Story)" },
  { value: "4:5", label: "4:5 (Portrait)" },
];

const STYLES = [
  { value: "fotografija", label: "Fotografija" },
  { value: "ilustracija", label: "Ilustracija" },
  { value: "minimalisticki", label: "Minimalističko" },
  { value: "3d", label: "3D render" },
  { value: "akvarel", label: "Akvarel" },
];

type PageState = "loading" | "ready" | "error";

export default function CreateImagePage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    prompt_text: "",
    reference_image: undefined as string | undefined,
    brand_id: "",
    aspect_ratio: "1:1",
    style: "" as string,
  });

  const { fieldErrors, validate, clearField } = useFormValidation(generateImageSchema);
  const { isSubmitting, result, submit, reset } = useGenerationSubmit({
    endpoint: "/api/generate/image",
  });

  const loadBrands = useCallback(async () => {
    setPageState("loading");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("brands")
        .select("id, user_id, name, logo_url, company_logo_url, tagline, categories, is_default, created_at")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) {
        console.error("[CreateImage] Brands query error:", error);
        throw error;
      }
      const b = (data as Brand[]) || [];
      setBrands(b);
      if (b.length > 0 && !form.brand_id) {
        const def = b.find((br) => br.is_default) || b[0];
        setForm((f) => ({ ...f, brand_id: def.id }));
      }
      setPageState("ready");
    } catch (err) {
      console.error("[CreateImage] Load error:", err);
      setPageState("error");
    }
  }, [form.brand_id]);

  useEffect(() => { loadBrands(); }, [loadBrands]);

  function handleRefImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((f) => ({ ...f, reference_image: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  }

  function removeRefImage() {
    setForm((f) => ({ ...f, reference_image: undefined }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, style: form.style || undefined };
    if (!validate(payload)) return;
    await submit(payload);
  }

  if (pageState === "loading") return <SkeletonForm />;
  if (pageState === "error") return <RetryError onRetry={loadBrands} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-[var(--accent)]" />
          Kreiraj AI sliku
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Generišite profesionalnu sliku za vaš brend ({CREDIT_COSTS.image} kredita).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
            <FormField label="Opis slike" htmlFor="prompt_text" error={fieldErrors.prompt_text} required>
              <textarea
                id="prompt_text"
                rows={4}
                value={form.prompt_text}
                onChange={(e) => { setForm((f) => ({ ...f, prompt_text: e.target.value })); clearField("prompt_text"); }}
                placeholder="Opišite kakvu sliku želite..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none transition-shadow"
              />
            </FormField>

            <FormField label="Referentna slika (opciono)" htmlFor="reference_image">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[var(--border)]">
                  <img src={imagePreview} alt="Ref" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeRefImage} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="reference_image" className="flex items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors text-sm text-[var(--text-secondary)]">
                  <Upload className="w-4 h-4" /> Upload referentne slike
                </label>
              )}
              <input ref={fileInputRef} id="reference_image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleRefImageUpload} className="hidden" />
            </FormField>

            <FormField label="Brend" htmlFor="brand_id" error={fieldErrors.brand_id} required>
              <select id="brand_id" value={form.brand_id} onChange={(e) => { setForm((f) => ({ ...f, brand_id: e.target.value })); clearField("brand_id"); }} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent">
                <option value="">Izaberite brend</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Format" htmlFor="aspect_ratio">
                <select id="aspect_ratio" value={form.aspect_ratio} onChange={(e) => setForm((f) => ({ ...f, aspect_ratio: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent">
                  {ASPECT_RATIOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FormField>

              <FormField label="Stil" htmlFor="style">
                <select id="style" value={form.style} onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent">
                  <option value="">Podrazumevani</option>
                  {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </FormField>
            </div>

            <LoadingButton type="submit" loading={isSubmitting} loadingText="Generisanje slike..." className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> Generiši sliku ({CREDIT_COSTS.image} kredita)
            </LoadingButton>
          </div>
        </form>

        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 sticky top-24">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Rezultat</h2>
            {result?.result_image_url ? (
              <div>
                <div className="relative rounded-xl overflow-hidden border border-[var(--border)]">
                  <img src={result.result_image_url} alt="Generisana slika" className="w-full h-auto" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button onClick={() => setFullscreenImage(true)} className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors" title="Pun ekran">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a href={result.result_image_url} download className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors" title="Preuzmi">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Potrošeno: {result.credits_used} kredita</span>
                  <span>Preostalo: {result.credits_remaining}</span>
                </div>
                <button onClick={reset} className="mt-4 w-full py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-colors">
                  Generiši ponovo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
                  <ImageIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Generisana slika će se prikazati ovde.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreenImage && result?.result_image_url && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreenImage(false)}>
          <button onClick={() => setFullscreenImage(false)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          <img src={result.result_image_url} alt="Puna veličina" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
