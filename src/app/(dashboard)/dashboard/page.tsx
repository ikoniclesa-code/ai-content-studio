"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Coins,
  FileText,
  Image,
  Video,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { RetryError } from "@/components/ui/RetryError";
import { EmptyState } from "@/components/ui/EmptyState";
import { CREDIT_COSTS } from "@/constants/plans";
import type { Profile, Generation, Subscription } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

interface DashboardData {
  profile: Profile;
  subscription: Subscription | null;
  recentGenerations: Generation[];
  stats: { textCount: number; imageCount: number; videoCount: number };
}

type PageState = "loading" | "success" | "error" | "empty";

export default function DashboardPage() {
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = useCallback(async () => {
    setState("loading");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, language, theme, onboarding_completed, credits, stripe_customer_id, is_blocked, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("[Dashboard] Profile query error:", profileError);
        throw profileError || new Error("Profile not found");
      }

      const [subRes, genRes, textRes, imageRes, videoRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, user_id, stripe_subscription_id, stripe_price_id, plan_name, billing_period, status, credits_per_period, current_period_start, current_period_end, cancel_at_period_end, created_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("generations")
          .select("id, user_id, brand_id, type, prompt_text, prompt_image_url, result_text, result_image_url, result_video_url, credits_used, ai_model, ai_tokens_used, status, error_message, metadata, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "text"),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "image"),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "video"),
      ]);

      if (subRes.error) console.error("[Dashboard] Subscription query error:", subRes.error);
      if (genRes.error) console.error("[Dashboard] Generations query error:", genRes.error);

      setData({
        profile: profileData as Profile,
        subscription: (subRes.data as Subscription) || null,
        recentGenerations: (genRes.data as Generation[]) || [],
        stats: {
          textCount: textRes.count ?? 0,
          imageCount: imageRes.count ?? 0,
          videoCount: videoRes.count ?? 0,
        },
      });
      setState("success");
    } catch (err) {
      console.error("[Dashboard] Load error:", err);
      setState("error");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state === "loading") return <SkeletonDashboard />;
  if (state === "error") return <RetryError onRetry={loadData} />;
  if (!data) return null;

  const { profile, subscription, recentGenerations, stats } = data;
  const totalGenerations = stats.textCount + stats.imageCount + stats.videoCount;
  const greeting = getGreeting();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          {greeting}, {profile.full_name?.split(" ")[0] || "Korisniče"} 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Evo pregleda vašeg naloga i poslednje aktivnosti.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Coins className="w-5 h-5" />}
          label="Preostali krediti"
          value={profile.credits.toLocaleString()}
          accent
          href="/settings"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Tekst postovi"
          value={stats.textCount.toString()}
          sub={`${CREDIT_COSTS.text} kredit po postu`}
        />
        <StatCard
          icon={<Image className="w-5 h-5" />}
          label="Generisane slike"
          value={stats.imageCount.toString()}
          sub={`${CREDIT_COSTS.image} kredita po slici`}
        />
        <StatCard
          icon={<Video className="w-5 h-5" />}
          label="Generisani video"
          value={stats.videoCount.toString()}
          sub={`${CREDIT_COSTS.video} kredita po videu`}
        />
      </div>

      {/* Quick actions + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            Brzo kreiranje
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickActionCard
              href="/create-text"
              icon={<FileText className="w-5 h-5" />}
              title="Tekst post"
              desc="Generiši post za mrežu"
              cost={`${CREDIT_COSTS.text} kredit`}
            />
            <QuickActionCard
              href="/create-image"
              icon={<Image className="w-5 h-5" />}
              title="AI slika"
              desc="Kreiraj sliku za brend"
              cost={`${CREDIT_COSTS.image} kredita`}
            />
            <QuickActionCard
              href="/create-video"
              icon={<Video className="w-5 h-5" />}
              title="AI video"
              desc="Napravi kratki video"
              cost={`${CREDIT_COSTS.video} kredita`}
            />
          </div>
        </div>

        {/* Plan info */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
            Vaš plan
          </h2>
          {subscription ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)] text-[var(--success)] text-xs font-semibold mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                Aktivan
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)] capitalize">
                {subscription.plan_name}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {subscription.credits_per_period?.toLocaleString()} kredita/mesec
              </p>
              {subscription.current_period_end && (
                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Sledeća obnova:{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString("sr-Latn")}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Nemate aktivnu pretplatu. Izaberite plan za pristup svim funkcijama.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Izaberi plan
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent generations */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            Poslednje generacije
          </h2>
          {totalGenerations > 0 && (
            <Link
              href="/history"
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium flex items-center gap-1"
            >
              Vidi sve
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentGenerations.length === 0 ? (
          <EmptyState
            icon="history"
            title="Još nemate generacija"
            description="Kreirajte svoj prvi sadržaj koristeći brzo kreiranje iznad."
            actionLabel="Kreiraj tekst"
            actionHref="/create-text"
          />
        ) : (
          <div className="space-y-3">
            {recentGenerations.map((gen) => (
              <div
                key={gen.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    gen.type === "text"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : gen.type === "image"
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  {gen.type === "text" ? (
                    <FileText className="w-4 h-4" />
                  ) : gen.type === "image" ? (
                    <Image className="w-4 h-4" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {gen.prompt_text || `${gen.type} generacija`}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {gen.credits_used} {gen.credits_used === 1 ? "kredit" : "kredita"} •{" "}
                    {formatDistanceToNow(new Date(gen.created_at), {
                      addSuffix: true,
                      locale: sr,
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    gen.status === "completed"
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : gen.status === "failed"
                        ? "bg-[var(--error-bg)] text-[var(--error)]"
                        : "bg-[var(--warning-bg)] text-[var(--warning)]"
                  }`}
                >
                  {gen.status === "completed"
                    ? "Završeno"
                    : gen.status === "failed"
                      ? "Greška"
                      : "U toku"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 transition-shadow hover:shadow-md ${
        href ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            accent
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--accent-light)] text-[var(--accent)]"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function QuickActionCard({
  href,
  icon,
  title,
  desc,
  cost,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cost: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center p-5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all group text-center"
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--accent-light)] group-hover:bg-[var(--accent)] flex items-center justify-center text-[var(--accent)] group-hover:text-white transition-colors mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
      <span className="mt-2 text-xs text-[var(--accent)] font-medium">{cost}</span>
    </Link>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Dobro jutro";
  if (hour < 18) return "Dobar dan";
  return "Dobro veče";
}
