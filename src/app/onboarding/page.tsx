"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  User,
  Building2,
  Palette,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { FormField } from "@/components/ui/FormField";
import { showSuccess, showError } from "@/lib/toast";
import { INDUSTRY_CATEGORIES } from "@/constants/categories";

const STEPS = [
  { id: 1, title: "Vaš profil", desc: "Osnovno o vama", icon: User },
  { id: 2, title: "Vaš brend", desc: "Dodajte brend", icon: Building2 },
  { id: 3, title: "Preferencije", desc: "Jezik i tema", icon: Palette },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
  });

  const [brandData, setBrandData] = useState({
    name: "",
    tagline: "",
    categories: [] as string[],
    logo_url: null as string | null,
  });

  const [preferences, setPreferences] = useState({
    language: "sr",
    theme: "light" as "light" | "dark",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function toggleCategory(cat: string) {
    setBrandData((d) => ({
      ...d,
      categories: d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat],
    }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name || null,
          language: preferences.language,
          theme: preferences.theme,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (brandData.name.trim()) {
        let logoUrl: string | null = null;

        if (logoPreview) {
          const blob = await fetch(logoPreview).then((r) => r.blob());
          const ext = blob.type.split("/")[1] || "png";
          const fileName = `${user.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(fileName, blob, { contentType: blob.type });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("logos")
              .getPublicUrl(fileName);
            logoUrl = urlData.publicUrl;
          }
        }

        await supabase.from("brands").insert({
          user_id: user.id,
          name: brandData.name,
          tagline: brandData.tagline || null,
          logo_url: logoUrl,
          categories: brandData.categories,
          is_default: true,
        });
      }

      if (preferences.theme === "dark") {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
      }

      showSuccess("Dobrodošli u AI Content Studio!");
      router.push("/pricing");
    } catch {
      showError("Greška pri čuvanju. Pokušajte ponovo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)] mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Dobrodošli u AI Content Studio
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Podesite nalog za najbolje iskustvo.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step > s.id
                    ? "bg-[var(--success)] text-white"
                    : step === s.id
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${step > s.id ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {STEPS[step - 1].title}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {step === 1 && "Unesite vaše ime da bismo personalizovali iskustvo."}
            {step === 2 && "Dodajte brend za koji ćete kreirati sadržaj."}
            {step === 3 && "Izaberite jezik i temu koja vam odgovara."}
          </p>

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <FormField label="Vaše ime" htmlFor="full_name">
                <input
                  id="full_name"
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ full_name: e.target.value })}
                  placeholder="Ime i prezime"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </FormField>
            </div>
          )}

          {/* Step 2: Brand */}
          {step === 2 && (
            <div className="space-y-4">
              <FormField label="Naziv brenda" htmlFor="brand_name">
                <input
                  id="brand_name"
                  type="text"
                  value={brandData.name}
                  onChange={(e) => setBrandData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Npr. Moj Biznis"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </FormField>

              <FormField label="Tagline (opciono)" htmlFor="tagline">
                <input
                  id="tagline"
                  type="text"
                  value={brandData.tagline}
                  onChange={(e) => setBrandData((d) => ({ ...d, tagline: e.target.value }))}
                  placeholder="Kratki opis ili slogan brenda"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              </FormField>

              <FormField label="Logo (opciono)" htmlFor="logo">
                {logoPreview ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)]">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="logo" className="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors text-sm text-[var(--text-secondary)]">
                    <Upload className="w-4 h-4" /> Upload logo (max 2MB)
                  </label>
                )}
                <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </FormField>

              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Kategorije</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        brandData.categories.includes(cat)
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <FormField label="Jezik interfejsa" htmlFor="pref_language">
                <select
                  id="pref_language"
                  value={preferences.language}
                  onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="sr">Srpski</option>
                  <option value="hr">Hrvatski</option>
                  <option value="en">English</option>
                </select>
              </FormField>

              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Tema</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, theme: "light" }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      preferences.theme === "light"
                        ? "border-[var(--accent)] bg-[var(--accent-light)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-[var(--text-primary)]">Svetla</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, theme: "dark" }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      preferences.theme === "dark"
                        ? "border-[var(--accent)] bg-[var(--accent-light)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-[var(--text-primary)]">Tamna</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Nazad
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-colors"
              >
                Sledeće <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <LoadingButton
                onClick={handleFinish}
                loading={saving}
                loadingText="Čuvanje..."
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-colors"
              >
                Završi podešavanje <Check className="w-4 h-4" />
              </LoadingButton>
            )}
          </div>

          {/* Skip */}
          <div className="text-center mt-4">
            <button
              onClick={handleFinish}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Preskoči za sada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
