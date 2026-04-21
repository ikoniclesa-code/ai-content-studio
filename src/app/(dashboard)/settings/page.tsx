"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  User,
  Palette,
  Globe,
  Building2,
  Save,
  Plus,
  Trash2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { FormField } from "@/components/ui/FormField";
import { RetryError } from "@/components/ui/RetryError";
import { Skeleton } from "@/components/ui/Skeleton";
import { showSuccess, showError } from "@/lib/toast";
import { useTheme } from "@/components/layout/ThemeProvider";
import type { Profile, Brand, Subscription } from "@/types/database";

type PageState = "loading" | "ready" | "error";
type ActiveTab = "profile" | "brands" | "subscription";

export default function SettingsPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    language: "sr",
    theme: "light" as "light" | "dark",
  });

  const [newBrand, setNewBrand] = useState({ name: "", tagline: "" });
  const [addingBrand, setAddingBrand] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  const loadData = useCallback(async () => {
    setPageState("loading");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, brandsRes, subRes] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, email, role, avatar_url, language, theme, onboarding_completed, credits, stripe_customer_id, is_blocked, created_at, updated_at")
          .eq("id", user.id)
          .single(),
        supabase.from("brands")
          .select("id, user_id, name, logo_url, company_logo_url, tagline, categories, is_default, created_at")
          .eq("user_id", user.id)
          .order("created_at"),
        supabase.from("subscriptions")
          .select("id, user_id, stripe_subscription_id, stripe_price_id, plan_name, billing_period, status, credits_per_period, current_period_start, current_period_end, cancel_at_period_end, created_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      if (profileRes.error) {
        console.error("[Settings] Profile query error:", profileRes.error);
        throw profileRes.error;
      }
      if (brandsRes.error) console.error("[Settings] Brands query error:", brandsRes.error);
      if (subRes.error) console.error("[Settings] Subscription query error:", subRes.error);

      const p = profileRes.data as Profile;
      setProfile(p);
      setProfileForm({ full_name: p.full_name || "", language: p.language, theme: p.theme });
      setBrands((brandsRes.data as Brand[]) || []);
      setSubscription((subRes.data as Subscription) || null);
      setPageState("ready");
    } catch (err) {
      console.error("[Settings] Load error:", err);
      setPageState("error");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          language: profileForm.language,
          theme: profileForm.theme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      setTheme(profileForm.theme);
      showSuccess("Profil je ažuriran.");
    } catch {
      showError("Greška pri čuvanju profila.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBrand() {
    if (!newBrand.name.trim()) return;
    setSavingBrand(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("brands")
        .insert({ user_id: user.id, name: newBrand.name, tagline: newBrand.tagline || null, categories: [], is_default: brands.length === 0 })
        .select()
        .single();
      if (error) throw error;
      setBrands((prev) => [...prev, data as Brand]);
      setNewBrand({ name: "", tagline: "" });
      setAddingBrand(false);
      showSuccess("Brend je dodat.");
    } catch {
      showError("Greška pri dodavanju brenda.");
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleDeleteBrand(brandId: string) {
    if (!confirm("Da li ste sigurni da želite da obrišete ovaj brend?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("brands").delete().eq("id", brandId);
      if (error) throw error;
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
      showSuccess("Brend je obrisan.");
    } catch {
      showError("Greška pri brisanju brenda.");
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showError("Greška pri otvaranju portala.");
    } catch {
      showError("Nema internet konekcije.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (pageState === "loading") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (pageState === "error") return <RetryError onRetry={loadData} />;

  const tabs = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "brands" as const, label: "Brendovi", icon: Building2 },
    { id: "subscription" as const, label: "Pretplata", icon: CreditCard },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--accent)]" />
          Podešavanja
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Upravljajte profilom, brendovima i pretplatom.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
          <FormField label="Puno ime" htmlFor="full_name">
            <input
              id="full_name"
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </FormField>

          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm cursor-not-allowed"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Jezik interfejsa" htmlFor="language">
              <select
                id="language"
                value={profileForm.language}
                onChange={(e) => setProfileForm((f) => ({ ...f, language: e.target.value as "sr" | "hr" | "en" }))}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="sr">Srpski</option>
                <option value="hr">Hrvatski</option>
                <option value="en">English</option>
              </select>
            </FormField>

            <FormField label="Tema" htmlFor="theme">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfileForm((f) => ({ ...f, theme: "light" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    profileForm.theme === "light"
                      ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  <Palette className="w-4 h-4" /> Svetla
                </button>
                <button
                  type="button"
                  onClick={() => setProfileForm((f) => ({ ...f, theme: "dark" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    profileForm.theme === "dark"
                      ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  <Globe className="w-4 h-4" /> Tamna
                </button>
              </div>
            </FormField>
          </div>

          <LoadingButton type="submit" loading={saving} loadingText="Čuvanje..." className="py-2.5 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors">
            <Save className="w-4 h-4" /> Sačuvaj promene
          </LoadingButton>
        </form>
      )}

      {/* Brands tab */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    {brand.name}
                    {brand.is_default && (
                      <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-light)] px-2 py-0.5 rounded-full">Podrazumevani</span>
                    )}
                  </p>
                  {brand.tagline && <p className="text-xs text-[var(--text-secondary)]">{brand.tagline}</p>}
                </div>
              </div>
              <button
                onClick={() => handleDeleteBrand(brand.id)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors"
                title="Obriši brend"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {addingBrand ? (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
              <FormField label="Naziv brenda" htmlFor="brand_name">
                <input
                  id="brand_name"
                  type="text"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Npr. Moj Brend"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </FormField>
              <FormField label="Tagline (opciono)" htmlFor="brand_tagline">
                <input
                  id="brand_tagline"
                  type="text"
                  value={newBrand.tagline}
                  onChange={(e) => setNewBrand((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="Kratki opis brenda"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </FormField>
              <div className="flex gap-3">
                <LoadingButton onClick={handleAddBrand} loading={savingBrand} loadingText="Dodavanje..." className="py-2 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors">
                  Dodaj
                </LoadingButton>
                <button type="button" onClick={() => { setAddingBrand(false); setNewBrand({ name: "", tagline: "" }); }} className="py-2 px-4 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-sm font-medium transition-colors">
                  Otkaži
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingBrand(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Dodaj novi brend
            </button>
          )}
        </div>
      )}

      {/* Subscription tab */}
      {activeTab === "subscription" && (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          {subscription ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)] text-[var(--success)] text-xs font-semibold mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                    Aktivna
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] capitalize">
                    {subscription.plan_name} plan
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {subscription.billing_period === "monthly" ? "Mesečna" : "Godišnja"} pretplata
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {profile?.credits.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">preostalih kredita</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Krediti po periodu</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{subscription.credits_per_period?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Sledeća obnova</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("sr-Latn") : "—"}
                  </p>
                </div>
              </div>

              <LoadingButton
                onClick={handleManageSubscription}
                loading={portalLoading}
                loadingText="Otvaranje portala..."
                className="py-2.5 px-5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] font-medium text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Upravljaj pretplatom
              </LoadingButton>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Nemate aktivnu pretplatu
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Izaberite plan da biste dobili kredite i pristup svim funkcijama.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
              >
                Pogledaj planove
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
