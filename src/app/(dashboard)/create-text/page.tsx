"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { FormField } from "@/components/ui/FormField";
import { RetryError } from "@/components/ui/RetryError";
import { SkeletonForm } from "@/components/ui/Skeleton";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useGenerationSubmit } from "@/hooks/useGenerationSubmit";
import { generateTextSchema } from "@/lib/validations";
import { CREDIT_COSTS } from "@/constants/plans";
import type { Brand } from "@/types/database";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "tiktok", label: "TikTok" },
];

const TONES = [
  { value: "profesionalni", label: "Profesionalni" },
  { value: "opusten", label: "Opušten" },
  { value: "humorican", label: "Humorističan" },
  { value: "informativan", label: "Informativan" },
  { value: "inspirativan", label: "Inspirativan" },
];

const LANGUAGES = [
  { value: "sr", label: "Srpski" },
  { value: "hr", label: "Hrvatski" },
  { value: "en", label: "English" },
];

type PageState = "loading" | "ready" | "error";

export default function CreateTextPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    prompt_text: "",
    prompt_image: undefined as string | undefined,
    brand_id: "",
    category: "",
    platform: "" as string,
    tone: "" as string,
    language: "sr",
  });

  const { fieldErrors, validate, clearField } = useFormValidation(generateTextSchema);
  const { isSubmitting, result, submit, reset } = useGenerationSubmit({
    endpoint: "/api/generate/text",
  });

  const loadBrands = useCallback(async () => {
    setPageState("loading");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("brands")
        .select("id, user_id, name, logo_url, company_logo_url, tagline, categories, is_default, created_at")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) {
        console.error("[CreateText] Brands query error:", error);
        throw error;
      }
      const b = (data as Brand[]) || [];
      setBrands(b);
      if (b.length > 0 && !form.brand_id) {
        const def = b.find((br) => br.is_default) || b[0];
        setForm((f) => ({
          ...f,
          brand_id: def.id,
          category: def.categories?.[0] || "",
        }));
      }
      setPageState("ready");
    } catch (err) {
      console.error("[CreateText] Load error:", err);
      setPageState("error");
    }
  }, [form.brand_id]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((f) => ({ ...f, prompt_image: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setForm((f) => ({ ...f, prompt_image: undefined }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      category: form.category || undefined,
      platform: form.platform || undefined,
      tone: form.tone || undefined,
    };
    if (!validate(payload)) return;
    await submit(payload);
  }

  function handleCopy() {
    if (result?.result_text) {
      navigator.clipboard.writeText(result.result_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const selectedBrand = brands.find((b) => b.id === form.brand_id);

  if (pageState === "loading") return <SkeletonForm />;
  if (pageState === "error") return <RetryError onRetry={loadBrands} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[var(--accent)]" />
          Kreiraj tekst post
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Generišite privlačan tekst za društvene mreže ({CREDIT_COSTS.text} kredit).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
            {/* Prompt */}
            <FormField label="Opis objave" htmlFor="prompt_text" error={fieldErrors.prompt_text}>
              <textarea
                id="prompt_text"
                rows={4}
                value={form.prompt_text}
                onChange={(e) => {
                  setForm((f) => ({ ...f, prompt_text: e.target.value }));
                  clearField("prompt_text");
                }}
                placeholder="Opišite kakvu objavu želite..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none transition-shadow"
              />
            </FormField>

            {/* Image upload */}
            <FormField label="Slika proizvoda (opciono)" htmlFor="prompt_image" error={fieldErrors.prompt_image}>
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[var(--border)]">
                  <img src={imagePreview} alt="Upload" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="prompt_image"
                  className="flex items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors text-sm text-[var(--text-secondary)]"
                >
                  <Upload className="w-4 h-4" />
                  Kliknite za upload slike (max 10MB)
                </label>
              )}
              <input
                ref={fileInputRef}
                id="prompt_image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </FormField>

            {/* Brand */}
            <FormField label="Brend" htmlFor="brand_id" error={fieldErrors.brand_id} required>
              <select
                id="brand_id"
                value={form.brand_id}
                onChange={(e) => {
                  const b = brands.find((br) => br.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    brand_id: e.target.value,
                    category: b?.categories?.[0] || f.category,
                  }));
                  clearField("brand_id");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="">Izaberite brend</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Category */}
            {selectedBrand && selectedBrand.categories.length > 0 && (
              <FormField label="Kategorija" htmlFor="category" error={fieldErrors.category} required>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, category: e.target.value }));
                    clearField("category");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  {selectedBrand.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Platform */}
              <FormField label="Platforma" htmlFor="platform">
                <select
                  id="platform"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="">Sve platforme</option>
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </FormField>

              {/* Tone */}
              <FormField label="Ton" htmlFor="tone">
                <select
                  id="tone"
                  value={form.tone}
                  onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="">Podrazumevani</option>
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </FormField>

              {/* Language */}
              <FormField label="Jezik" htmlFor="language" required>
                <select
                  id="language"
                  value={form.language}
                  onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Submit */}
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              loadingText="Generisanje u toku..."
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generiši tekst ({CREDIT_COSTS.text} kredit)
            </LoadingButton>
          </div>
        </form>

        {/* Result */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 sticky top-24">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Rezultat
            </h2>
            {result ? (
              <div>
                <div className="relative">
                  <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {result.result_text}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
                    title="Kopiraj u clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[var(--success)]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Potrošeno: {result.credits_used} kredit</span>
                  <span>Preostalo: {result.credits_remaining}</span>
                </div>
                <button
                  onClick={reset}
                  className="mt-4 w-full py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-lg transition-colors"
                >
                  Generiši ponovo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generisani tekst će se prikazati ovde.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
