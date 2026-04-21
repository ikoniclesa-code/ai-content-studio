"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  FileText,
  Image,
  Video,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  Maximize2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SkeletonHistory } from "@/components/ui/Skeleton";
import { RetryError } from "@/components/ui/RetryError";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Generation } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

type TypeFilter = "all" | "text" | "image" | "video";
type StatusFilter = "all" | "completed" | "failed" | "pending";
type PageState = "loading" | "success" | "error";

export default function HistoryPage() {
  const [state, setState] = useState<PageState>("loading");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setState("loading");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("generations")
        .select("id, user_id, brand_id, type, prompt_text, prompt_image_url, result_text, result_image_url, result_video_url, credits_used, ai_model, ai_tokens_used, status, error_message, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) {
        console.error("[History] Generations query error:", error);
        throw error;
      }
      setGenerations((data as Generation[]) || []);
      setState("success");
    } catch (err) {
      console.error("[History] Load error:", err);
      setState("error");
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = generations.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.prompt_text?.toLowerCase().includes(q) ||
      g.result_text?.toLowerCase().includes(q)
    );
  });

  if (state === "loading") return <SkeletonHistory />;
  if (state === "error") return <RetryError onRetry={loadData} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Clock className="w-6 h-6 text-[var(--accent)]" />
          Istorija generacija
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Pregledajte sve prethodno generisane sadržaje.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretražite po promptu..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
            >
              <option value="all">Svi tipovi</option>
              <option value="text">Tekst</option>
              <option value="image">Slika</option>
              <option value="video">Video</option>
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
          >
            <option value="all">Svi statusi</option>
            <option value="completed">Završeno</option>
            <option value="failed">Greška</option>
            <option value="pending">U toku</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="history"
          title={searchQuery ? "Nema rezultata pretrage" : "Nema generacija"}
          description={
            searchQuery
              ? "Pokušajte sa drugačijim pojmom pretrage."
              : "Kreirajte svoj prvi sadržaj koristeći opcije u meniju."
          }
          actionLabel={searchQuery ? undefined : "Kreiraj tekst"}
          actionHref={searchQuery ? undefined : "/create-text"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((gen) => (
            <div
              key={gen.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    gen.type === "text"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : gen.type === "image"
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  {gen.type === "text" ? <FileText className="w-4 h-4" /> : gen.type === "image" ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">
                      {gen.type === "text" ? "Tekst" : gen.type === "image" ? "Slika" : "Video"}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      gen.status === "completed" ? "bg-[var(--success-bg)] text-[var(--success)]" : gen.status === "failed" ? "bg-[var(--error-bg)] text-[var(--error)]" : "bg-[var(--warning-bg)] text-[var(--warning)]"
                    }`}>
                      {gen.status === "completed" ? "Završeno" : gen.status === "failed" ? "Greška" : "U toku"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                    {gen.prompt_text || "Bez prompta"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                    <span>{gen.credits_used} {gen.credits_used === 1 ? "kredit" : "kredita"}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(gen.created_at), { addSuffix: true, locale: sr })}</span>
                    {gen.ai_model && <>
                      <span>•</span>
                      <span>{gen.ai_model}</span>
                    </>}
                  </div>

                  {/* Result preview */}
                  {gen.status === "completed" && (
                    <div className="mt-3">
                      {gen.type === "text" && gen.result_text && (
                        <div className="relative">
                          <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-sm text-[var(--text-primary)] line-clamp-4 whitespace-pre-wrap">
                            {gen.result_text}
                          </div>
                          <button
                            onClick={() => handleCopy(gen.result_text!, gen.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                            title="Kopiraj"
                          >
                            {copiedId === gen.id ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                      {gen.type === "image" && gen.result_image_url && (
                        <div className="flex gap-2 mt-1">
                          <img
                            src={gen.result_image_url}
                            alt="Generated"
                            className="w-24 h-24 rounded-lg object-cover border border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setFullscreenImage(gen.result_image_url!)}
                          />
                          <div className="flex flex-col gap-1">
                            <button onClick={() => setFullscreenImage(gen.result_image_url!)} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> Puna veličina
                            </button>
                            <a href={gen.result_image_url} download className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                              <Download className="w-3 h-3" /> Preuzmi
                            </a>
                          </div>
                        </div>
                      )}
                      {gen.type === "video" && gen.result_video_url && (
                        <div className="mt-1">
                          <video src={gen.result_video_url} controls className="w-48 rounded-lg border border-[var(--border)]" />
                          <a href={gen.result_video_url} download className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent)] hover:underline">
                            <Download className="w-3 h-3" /> Preuzmi video
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {gen.status === "failed" && gen.error_message && (
                    <p className="mt-2 text-xs text-[var(--error)]">{gen.error_message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          <img src={fullscreenImage} alt="Puna veličina" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
