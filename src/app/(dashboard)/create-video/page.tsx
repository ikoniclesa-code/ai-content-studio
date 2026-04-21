"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Video, Upload, Download, X, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { FormField } from "@/components/ui/FormField";
import { RetryError } from "@/components/ui/RetryError";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { generateVideoSchema } from "@/lib/validations";
import { CREDIT_COSTS } from "@/constants/plans";
import type { Brand } from "@/types/database";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait/Story)" },
  { value: "1:1", label: "1:1 (Square)" },
];

type PageState = "loading" | "ready" | "error";

export default function CreateVideoPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    prompt_text: "",
    reference_image: undefined as string | undefined,
    brand_id: "",
    duration: 8,
    aspect_ratio: "16:9",
  });

  const { fieldErrors, validate, clearField } = useFormValidation(generateVideoSchema);
  const { isSubmitting, result, submit, reset } = useGenerationSubmit({
    endpoint: "/api/generate/video",
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
        console.error("[CreateVideo] Brands query error:", error);
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
      console.error("[CreateVideo] Load error:", err);
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
    if (!validate(form)) return;
    await submit(form);
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
          <Video className="w-6 h-6 text-[var(--accent)]" />
          Kreiraj AI video
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Generišite kratki video sadržaj za vaš brend ({CREDIT_COSTS.video} kredita).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
            <FormField label="Opis videa" htmlFor="prompt_text" error={fieldErrors.prompt_text} required>
              <textarea
                id="prompt_text"
                rows={4}
                value={form.prompt_text}
                onChange={(e) => { setForm((f) => ({ ...f, prompt_text: e.target.value })); clearField("prompt_text"); }}
                placeholder="Opišite kakav video želite..."
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
              <FormField label="Trajanje (sekunde)" htmlFor="duration">
                <input
                  type="range"
                  id="duration"
                  min={5}
                  max={15}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                  <span>5s</span>
                  <span className="font-semibold text-[var(--text-primary)]">{form.duration}s</span>
                  <span>15s</span>
                </div>
              </FormField>

              <FormField label="Format" htmlFor="aspect_ratio">
                <select id="aspect_ratio" value={form.aspect_ratio} onChange={(e) => setForm((f) => ({ ...f, aspect_ratio: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent">
                  {ASPECT_RATIOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </FormField>
            </div>

            <LoadingButton type="submit" loading={isSubmitting} loadingText="Generisanje videa..." className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> Generiši video ({CREDIT_COSTS.video} kredita)
            </LoadingButton>
          </div>
        </form>

        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 sticky top-24">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Rezultat</h2>
            {result?.result_video_url ? (
              <div>
                <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-black">
                  <video src={result.result_video_url} controls className="w-full h-auto" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-[var(--text-secondary)]">
                    <span>Potrošeno: {result.credits_used} kredita</span>
                    <span className="mx-2">•</span>
                    <span>Preostalo: {result.credits_remaining}</span>
                  </div>
                  <a href={result.result_video_url} download className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                    <Download className="w-3.5 h-3.5" /> Preuzmi
                  </a>
                </div>
                <button onClick={reset} className="mt-4 w-full py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-colors">
                  Generiši ponovo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
                  <Video className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Generisani video će se prikazati ovde.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
