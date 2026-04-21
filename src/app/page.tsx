import Link from "next/link";
import {
  Sparkles,
  FileText,
  Image,
  Video,
  Zap,
  Shield,
  BarChart3,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";
import { PLANS, CREDIT_COSTS } from "@/constants/plans";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ──────── Navbar ──────── */}
      <nav className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              AI Content Studio
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Funkcije
            </a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Cene
            </a>
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Kako funkcioniše
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Prijavi se
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Započni besplatno
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ──────── Hero ──────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--accent)]">Powered by GPT-5.4 & Gemini</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Kreirajte sadržaj za{" "}
              <span className="text-[var(--accent)]">društvene mreže</span>{" "}
              uz AI
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Generišite tekstove, slike i video za Instagram, Facebook, LinkedIn
              i druge platforme — za nekoliko sekundi, ne sati.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Započni besplatno
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Kako funkcioniše
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "10K+", label: "Generisanih postova" },
              { value: "500+", label: "Aktivnih korisnika" },
              { value: "3", label: "AI modela" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── Features ──────── */}
      <section id="features" className="py-20 sm:py-28 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Sve što vam treba na jednom mestu
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Kompletna platforma za kreiranje sadržaja pomoću najnovijih AI modela.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Tekst postovi",
                desc: "Generišite privlačne objave za sve društvene mreže sa optimizovanim hashtag-ovima.",
                cost: `${CREDIT_COSTS.text} kredit`,
              },
              {
                icon: Image,
                title: "AI slike",
                desc: "Kreirajte profesionalne slike za vaš brend sa Gemini AI modelom.",
                cost: `${CREDIT_COSTS.image} kredita`,
              },
              {
                icon: Video,
                title: "AI video",
                desc: "Generišite kratke video sadržaje za Stories, Reels i TikTok.",
                cost: `${CREDIT_COSTS.video} kredita`,
              },
              {
                icon: Zap,
                title: "Brza generacija",
                desc: "Rezultat za nekoliko sekundi. Bez čekanja, bez komplikovanih podešavanja.",
                cost: null,
              },
              {
                icon: Shield,
                title: "Brendiranje",
                desc: "Dodajte svoje brendove i generišite sadržaj prilagođen vašem stilu.",
                cost: null,
              },
              {
                icon: BarChart3,
                title: "Analitika",
                desc: "Pratite potrošnju kredita i statistiku generisanog sadržaja.",
                cost: null,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent-light)] flex items-center justify-center mb-4 group-hover:bg-[var(--accent)] transition-colors">
                  <feature.icon className="w-5 h-5 text-[var(--accent)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
                {feature.cost && (
                  <span className="inline-block mt-3 text-xs font-medium text-[var(--accent)] bg-[var(--accent-light)] px-2.5 py-1 rounded-full">
                    {feature.cost}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── How it works ──────── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Kako funkcioniše
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Tri jednostavna koraka do savršenog sadržaja.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Opišite šta želite",
                desc: "Unesite prompt, izaberite platformu, ton i jezik. Opciono dodajte sliku proizvoda.",
              },
              {
                step: "02",
                title: "AI generiše sadržaj",
                desc: "Naš AI kreira optimizovan tekst, sliku ili video za vašu ciljnu platformu.",
              },
              {
                step: "03",
                title: "Kopirajte i objavite",
                desc: "Preuzmite rezultat jednim klikom i objavite na svojoj društvenoj mreži.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)] text-white text-lg font-bold mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── Pricing ──────── */}
      <section id="pricing" className="py-20 sm:py-28 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Jednostavne i transparentne cene
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Izaberite plan koji odgovara vašim potrebama. Bez skrivenih troškova.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Starter</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{PLANS.starter.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  {PLANS.starter.monthlyUsd.toFixed(2)} €
                </span>
                <span className="text-sm text-[var(--text-secondary)]">/mesec</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {PLANS.starter.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                    <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 w-full py-3 px-4 rounded-xl text-center font-semibold text-sm border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
              >
                Započni sa Starter
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-[var(--bg-card)] rounded-2xl border-2 border-[var(--accent)] p-8 flex flex-col shadow-lg shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                  <Star className="w-3 h-3" />
                  Najpopularniji
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Pro</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{PLANS.pro.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  {PLANS.pro.monthlyUsd.toFixed(2)} €
                </span>
                <span className="text-sm text-[var(--text-secondary)]">/mesec</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {PLANS.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                    <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 w-full py-3 px-4 rounded-xl text-center font-semibold text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
              >
                Započni sa Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── CTA ──────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-[var(--accent)] to-indigo-600 rounded-3xl p-12 sm:p-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Spremni da kreirate sadržaj brže?
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
              Pridružite se stotinama korisnika koji već koriste AI za kreiranje
              sadržaja za društvene mreže.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[var(--accent)] font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Kreirajte besplatan nalog
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──────── Footer ──────── */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                AI Content Studio
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              &copy; {new Date().getFullYear()} AI Content Studio. Sva prava zadržana.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
