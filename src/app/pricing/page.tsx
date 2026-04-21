"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS, STRIPE_PRICE_IDS, CREDIT_COSTS } from "@/constants/plans";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { showError } from "@/lib/toast";
import {
  Sparkles,
  Check,
  Star,
  FileText,
  Image,
  Video,
} from "lucide-react";

type BillingPeriod = "monthly" | "yearly";

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  async function handleSelectPlan(plan: "starter" | "pro") {
    const priceId =
      billing === "monthly"
        ? plan === "starter"
          ? STRIPE_PRICE_IDS.starter_monthly
          : STRIPE_PRICE_IDS.pro_monthly
        : plan === "starter"
          ? STRIPE_PRICE_IDS.starter_yearly
          : STRIPE_PRICE_IDS.pro_yearly;

    setLoadingPlan(plan);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirectTo=/pricing");
          return;
        }
        if (res.status === 409) {
          showError(data.error ?? "Već imate aktivnu pretplatu.");
          return;
        }
        showError(data.error ?? "Greška pri kreiranju sesije.");
        return;
      }

      if (data.url) window.location.href = data.url;
    } catch {
      showError("Nema internet konekcije. Pokušajte ponovo.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              AI Content Studio
            </span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Prijavi se
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Izaberite plan koji vam odgovara
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Kreirajte AI sadržaj za društvene mreže brzo i jednostavno.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
            Mesečno
          </span>
          <button
            onClick={() => setBilling((b) => (b === "monthly" ? "yearly" : "monthly"))}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            style={{ backgroundColor: billing === "yearly" ? "var(--accent)" : "var(--border)" }}
            aria-label="Prebaci na godišnje plaćanje"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billing === "yearly" ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${billing === "yearly" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
            Godišnje
          </span>
          {billing === "yearly" && (
            <span className="ml-1 inline-flex items-center rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--success)]">
              Uštedite 20%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 flex flex-col">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Starter</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{PLANS.starter.description}</p>
            <div className="my-6 flex items-baseline gap-1">
              {billing === "yearly" && (
                <span className="text-lg text-[var(--text-secondary)] line-through">{PLANS.starter.monthlyUsd.toFixed(2)} €</span>
              )}
              <span className="text-4xl font-bold text-[var(--text-primary)]">
                {(billing === "monthly" ? PLANS.starter.monthlyUsd : PLANS.starter.yearlyMonthlyUsd).toFixed(2)} €
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {billing === "monthly" ? "/mesec" : `/mesec (${PLANS.starter.yearlyUsd.toFixed(2)} €/god)`}
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PLANS.starter.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                  <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <LoadingButton
              onClick={() => handleSelectPlan("starter")}
              loading={loadingPlan === "starter"}
              disabled={loadingPlan !== null}
              loadingText="Preusmeravanje..."
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
            >
              Izaberi Starter
            </LoadingButton>
          </div>

          <div className="relative bg-[var(--bg-card)] rounded-2xl border-2 border-[var(--accent)] p-8 flex flex-col shadow-lg shadow-blue-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                <Star className="w-3 h-3" /> Najpopularniji
              </span>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Pro</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{PLANS.pro.description}</p>
            <div className="my-6 flex items-baseline gap-1">
              {billing === "yearly" && (
                <span className="text-lg text-[var(--text-secondary)] line-through">{PLANS.pro.monthlyUsd.toFixed(2)} €</span>
              )}
              <span className="text-4xl font-bold text-[var(--text-primary)]">
                {(billing === "monthly" ? PLANS.pro.monthlyUsd : PLANS.pro.yearlyMonthlyUsd).toFixed(2)} €
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {billing === "monthly" ? "/mesec" : `/mesec (${PLANS.pro.yearlyUsd.toFixed(2)} €/god)`}
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PLANS.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                  <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <LoadingButton
              onClick={() => handleSelectPlan("pro")}
              loading={loadingPlan === "pro"}
              disabled={loadingPlan !== null}
              loadingText="Preusmeravanje..."
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
            >
              Izaberi Pro
            </LoadingButton>
          </div>
        </div>

        {/* Credit costs */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Cena po generisanju
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Tekst post</p>
              <p className="text-xs text-[var(--text-secondary)]">{CREDIT_COSTS.text} kredit</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] mb-2">
                <Image className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Slika</p>
              <p className="text-xs text-[var(--text-secondary)]">{CREDIT_COSTS.image} kredita</p>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] mb-2">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Video</p>
              <p className="text-xs text-[var(--text-secondary)]">{CREDIT_COSTS.video} kredita</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
