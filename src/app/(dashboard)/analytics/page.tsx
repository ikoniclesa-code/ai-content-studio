"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  FileText,
  Image,
  Video,
  Coins,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RetryError } from "@/components/ui/RetryError";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface AnalyticsData {
  totalGenerations: number;
  textCount: number;
  imageCount: number;
  videoCount: number;
  totalCreditsUsed: number;
  weeklyData: { day: string; count: number }[];
  typeDistribution: { type: string; count: number; percentage: number }[];
}

type PageState = "loading" | "success" | "error" | "empty";

export default function AnalyticsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadData = useCallback(async () => {
    setState("loading");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: gens, error } = await supabase
        .from("generations")
        .select("type, credits_used, created_at, status")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (error) {
        console.error("[Analytics] Generations query error:", error);
        throw error;
      }

      const generations = gens || [];
      if (generations.length === 0) {
        setState("empty");
        return;
      }

      const textCount = generations.filter((g) => g.type === "text").length;
      const imageCount = generations.filter((g) => g.type === "image").length;
      const videoCount = generations.filter((g) => g.type === "video").length;
      const totalCreditsUsed = generations.reduce((sum, g) => sum + (g.credits_used || 0), 0);
      const total = generations.length;

      const now = new Date();
      const days = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toISOString().split("T")[0];
        const count = generations.filter((g) => g.created_at.startsWith(dayStr)).length;
        return { day: days[d.getDay()], count };
      });

      const typeDistribution = [
        { type: "Tekst", count: textCount, percentage: total > 0 ? Math.round((textCount / total) * 100) : 0 },
        { type: "Slika", count: imageCount, percentage: total > 0 ? Math.round((imageCount / total) * 100) : 0 },
        { type: "Video", count: videoCount, percentage: total > 0 ? Math.round((videoCount / total) * 100) : 0 },
      ];

      setData({
        totalGenerations: total,
        textCount,
        imageCount,
        videoCount,
        totalCreditsUsed,
        weeklyData,
        typeDistribution,
      });
      setState("success");
    } catch (err) {
      console.error("[Analytics] Load error:", err);
      setState("error");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (state === "loading") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (state === "error") return <RetryError onRetry={loadData} />;
  if (state === "empty") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon="chart"
          title="Nema podataka za analitiku"
          description="Kreirajte sadržaj da biste videli analitiku i statistiku."
          actionLabel="Kreiraj prvi sadržaj"
          actionHref="/create-text"
        />
      </div>
    );
  }

  if (!data) return null;
  const maxWeekly = Math.max(...data.weeklyData.map((d) => d.count), 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[var(--accent)]" />
          Analitika
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Pratite potrošnju i aktivnost generisanja sadržaja.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticCard icon={<TrendingUp className="w-5 h-5" />} label="Ukupno generacija" value={data.totalGenerations.toString()} />
        <AnalyticCard icon={<Coins className="w-5 h-5" />} label="Utrošeni krediti" value={data.totalCreditsUsed.toLocaleString()} />
        <AnalyticCard icon={<FileText className="w-5 h-5" />} label="Tekst postova" value={data.textCount.toString()} />
        <AnalyticCard icon={<Image className="w-5 h-5" />} label="Slika + Video" value={(data.imageCount + data.videoCount).toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly chart */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            Poslednji 7 dana
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {data.weeklyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                <span className="text-xs font-medium text-[var(--text-primary)]">{d.count}</span>
                <div className="w-full max-w-[40px] rounded-t-lg bg-[var(--accent-light)] relative overflow-hidden" style={{ height: `${Math.max((d.count / maxWeekly) * 100, 8)}%` }}>
                  <div className="absolute inset-0 bg-[var(--accent)] rounded-t-lg" style={{ opacity: d.count > 0 ? 1 : 0.15 }} />
                </div>
                <span className="text-xs text-[var(--text-secondary)]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type distribution */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            Distribucija po tipu
          </h2>
          <div className="space-y-5">
            {data.typeDistribution.map((item) => {
              const colors = {
                Tekst: { bar: "bg-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
                Slika: { bar: "bg-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
                Video: { bar: "bg-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
              }[item.type] || { bar: "bg-gray-500", bg: "bg-gray-100" };

              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.type === "Tekst" ? <FileText className="w-4 h-4 text-blue-500" /> : item.type === "Slika" ? <Image className="w-4 h-4 text-purple-500" /> : <Video className="w-4 h-4 text-rose-500" />}
                      <span className="text-sm font-medium text-[var(--text-primary)]">{item.type}</span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${colors.bg} overflow-hidden`}>
                    <div className={`h-full rounded-full ${colors.bar} transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Prosečna potrošnja</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {data.totalGenerations > 0 ? Math.round(data.totalCreditsUsed / data.totalGenerations) : 0} kredita/gen.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</p>
    </div>
  );
}
