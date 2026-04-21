**AI CONTENT STUDIO SI**

Kompletan plan razvoja SaaS aplikacije

Vodic za razvoj u Cursor IDE

**Tech Stack**

Next.js 14+ (App Router)  TypeScript  Tailwind CSS

Supabase (DB + Auth + Storage)  Stripe  Vercel

AI: GPT-5.4 (tekst)   (slike)  Veo 3.1 Lite (video)

Verzija 1.0  April 2026

**Sadrzaj**

**FAZA 0: Sta si propustio i sta moras znati pre pocetka**

Pre nego sto krenemo sa planom, evo stvari koje MORAS da resis pre bilo kakvog kodiranja:

**0.1 Stvari koje nedostaju u tvom originalnom planu**

**A) Pravni i regulatorni zahtevi**

- Privacy Policy (Politika privatnosti) --- OBAVEZNA za svaku aplikaciju koja prikuplja podatke. Bez nje ne mozes ni na Google ni na Apple store.
- Terms of Service (Uslovi koriscenja) --- OBAVEZNI. Definisu prava i obaveze korisnika.
- Cookie Policy --- ako ciljate EU korisnike, GDPR zahteva saglasnost za kolacice.
- GDPR compliance --- pravo korisnika da zatrazi brisanje svih podataka (Right to be forgotten).
- Imprint/O nama stranica --- obavezna u EU za komercijalne sajtove.

+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **KRITICNO UPOZORENJE**                                                                                                                                      |
|                                                                                                                                                              |
| Bez Privacy Policy i Terms of Service NE MOZETE legalno naplacivati korisnike. Stripe takode zahteva ove stranice pre nego sto odobri vas nalog za placanje. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------+

**B) Email sistem**

- Transakcioni emailovi --- potvrda registracije, reset lozinke, potvrda placanja, obnova pretplate.
- Email provajder --- preporuka: Resend ili Postmark (besplatni do 100 emailova/dan). Supabase ima ugraden email ali je ogranicen.
- Email template-ovi --- brendirani, profesionalni emailovi, ne genericki tekst.

**C) Monitoring i logovanje**

- Error tracking --- Sentry (besplatan tier). Kada se greska desi u produkciji, ti moras da znas o tome PRE nego sto korisnik prijavi.
- Analitika --- Posthog ili Plausible (GDPR friendly) za pracenje koriscenja aplikacije.
- Uptime monitoring --- BetterUptime ili UptimeRobot (besplatan) --- obavestava te ako sajt padne.
- Logovanje API poziva --- svaki poziv ka AI servisima mora biti logovan radi debugovanja i racunovodstva.

**D) Bezbednost koju si propustio**

- CORS podesavanja --- ko sme da poziva tvoj API.
- CSP (Content Security Policy) --- zastita od XSS napada.
- Rate limiting po IP adresi --- ne samo po korisniku, vec i po IP-u za neprijavljene korisnike.
- Honey pot polja u formama --- zastita od botova na registraciji.
- Brute force zastita --- zakljucaj nalog posle 5 neuspesnih pokusaja logina.
- Input sanitizacija --- SVE sto korisnik unese mora biti procisceno pre nego sto stigne u bazu ili AI servis.

**E) SEO i performanse**

- Meta tagovi za svaku stranicu (title, description, og:image).
- Sitemap.xml i robots.txt.
- Open Graph tagovi za deljenje na drustvenim mrezama.
- Web Vitals optimizacija (LCP, FID, CLS).
- Kompresija slika --- SVE slike koje korisnik upload-uje moraju biti kompresovane pre cuvanja.

**F) Backup i oporavak**

- Supabase automatski backup --- ukljuci Point-in-Time Recovery (dostupno na Pro planu).
- Strategija za rollback --- sta radis ako deploy pokvari produkciju.
- Export podataka --- korisnik mora moci da exportuje svoje podatke (GDPR zahtev).

**G) Onboarding korisnika**

- Onboarding email sekvenca --- 3-5 emailova koji vode korisnika kroz prvu nedelju.
- In-app tutoriali --- kratki tooltip-ovi koji objasnavaju svaku funkciju prvi put.
- Help/FAQ stranica --- odgovori na najcesca pitanja.

**H) AI specificne brige**

- Content moderation --- sta radis ako AI generise neprikladan sadrzaj? Mozes koristiti OpenAI Moderation API ili ugradis sopstvenu proveru.
- AI output caching --- ako dva korisnika traze slican sadrzaj, nemoj trositi kredite na isti poziv.
- Prompt injection zastita --- korisnik moze pokusati da manipulise AI-jem kroz prompt. Moras sanitizovati korisnikov unos.
- AI model fallback --- sta ako GPT-5.4 padne? Mora postojati plan B (npr. Claude ili drugi model kao privremena zamena).
- Velicina odgovora --- ogranici max tokene u AI odgovoru da ne bi korisnik jednim zahtevom potrošio premnogo resursa.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**FAZA 1: Plan i arhitektura**

**1.1 Struktura foldera projekta**

Ovo je kompletna struktura foldera koju ces kreirati u Cursoru:

**ai-content-studio/**

├── .env.local  DEV tajni kljucevi

├── .env.production  PROD tajni kljucevi (NIKAD u Git-u!)

├── .gitignore

├── next.config.ts

├── tailwind.config.ts

├── tsconfig.json

├── package.json

├── middleware.ts  Auth zastita svih ruta

├── src/

│ ├── app/  Next.js App Router

│ │ ├── (auth)/  Grupisane auth stranice

│ │ │ ├── login/page.tsx

│ │ │ ├── register/page.tsx

│ │ │ └── reset-password/page.tsx

│ │ ├── (dashboard)/  Zastitene stranice

│ │ │ ├── layout.tsx  Sidebar + header layout

│ │ │ ├── dashboard/page.tsx

│ │ │ ├── create-text/page.tsx

│ │ │ ├── create-image/page.tsx

│ │ │ ├── create-video/page.tsx

│ │ │ ├── history/page.tsx

│ │ │ ├── analytics/page.tsx

│ │ │ └── settings/page.tsx

│ │ ├── (admin)/  Admin stranice

│ │ │ ├── layout.tsx  Admin layout + provera uloge

│ │ │ └── admin/

│ │ │ ├── page.tsx  Admin dashboard

│ │ │ ├── users/page.tsx

│ │ │ └── logs/page.tsx

│ │ ├── onboarding/  Onboarding koraci

│ │ │ └── page.tsx

│ │ ├── api/  API rute

│ │ │ ├── generate/

│ │ │ │ ├── text/route.ts

│ │ │ │ ├── image/route.ts

│ │ │ │ └── video/route.ts

│ │ │ ├── webhooks/

│ │ │ │ └── stripe/route.ts

│ │ │ ├── stripe/

│ │ │ │ ├── checkout/route.ts

│ │ │ │ └── portal/route.ts

│ │ │ ├── admin/  Admin API rute

│ │ │ └── user/  Korisnicke API rute

│ │ ├── page.tsx  Landing page

│ │ └── layout.tsx  Root layout

│ ├── components/  Reusable komponente

│ │ ├── ui/  Osnovne UI komponente

│ │ ├── forms/  Form komponente

│ │ ├── layout/  Layout komponente

│ │ └── dashboard/  Dashboard komponente

│ ├── lib/  Pomocne funkcije

│ │ ├── supabase/

│ │ │ ├── client.ts  Browser Supabase klijent

│ │ │ ├── server.ts  Server Supabase klijent

│ │ │ └── admin.ts  Service role klijent

│ │ ├── stripe.ts  Stripe konfiguracija

│ │ ├── ai/  AI servisi

│ │ │ ├── text-generator.ts

│ │ │ ├── image-generator.ts

│ │ │ └── video-generator.ts

│ │ ├── validations.ts  Zod seme za validaciju

│ │ ├── rate-limiter.ts  Rate limiting logika

│ │ ├── credits.ts  Logika za kredite

│ │ └── utils.ts  Opste pomocne funkcije

│ ├── hooks/  Custom React hooks

│ ├── types/  TypeScript tipovi

│ │ ├── database.ts  Tipovi za bazu

│ │ └── api.ts  Tipovi za API

│ ├── i18n/  Internacionalizacija

│ │ ├── locales/

│ │ │ ├── sr.json  Srpski

│ │ │ ├── hr.json  Hrvatski

│ │ │ └── en.json  Engleski

│ │ └── config.ts

│ └── constants/  Konstante aplikacije

│ ├── plans.ts  Cenovni planovi

│ └── categories.ts  Kategorije industrija

└── supabase/

├── migrations/  SQL migracije

└── seed.sql  Pocetni podaci

**1.2 Kompletna sema baze podataka (Supabase/PostgreSQL)**

Svaka tabela je detaljno opisana sa svim kolonama, tipovima i relacijama.

**Tabela: profiles**

Prosiruje Supabase auth.users tabelu sa dodatnim podacima o korisniku.

---

  **Kolona**             **Tip**                      **Opis**

  id                     UUID (PK, FK → auth.users)   Primarni kljuc, referencira auth.users

  full_name              TEXT                         Puno ime korisnika

  email                  TEXT NOT NULL                Email korisnika

  role                   TEXT DEFAULT user        user ili admin

  avatar_url             TEXT                         URL profilne slike

  language               TEXT DEFAULT sr          sr, hr, ili en

  theme                  TEXT DEFAULT light       light ili dark

  onboarding_completed   BOOLEAN DEFAULT false        Da li je zavrsio onboarding

  credits                INTEGER DEFAULT 0            Trenutni broj kredita

  stripe_customer_id     TEXT                         Stripe Customer ID

  created_at             TIMESTAMPTZ                  Datum kreiranja

  updated_at             TIMESTAMPTZ                  Datum poslednjeg azuriranja

---

**Tabela: brands**

Brendovi koje korisnik unese tokom onboarding-a. Jedan korisnik moze imati vise brendova.

---

  **Kolona**         **Tip**                 **Opis**

  id                 UUID (PK)               Primarni kljuc

  user_id            UUID (FK → profiles)    Vlasnik brenda

  name               TEXT NOT NULL           Naziv brenda

  logo_url           TEXT                    URL loga brenda

  company_logo_url   TEXT                    URL loga kompanije

  tagline            TEXT                    Poznata recenica brenda

  categories         TEXT (array)        Izabrane kategorije

  is_default         BOOLEAN DEFAULT false   Da li je podrazumevani brend

  created_at         TIMESTAMPTZ             Datum kreiranja

---

**Tabela: subscriptions**

Prati aktivne pretplate korisnika.

---

  **Kolona**               **Tip**                 **Opis**

  id                       UUID (PK)               Primarni kljuc

  user_id                  UUID (FK → profiles)    Korisnik

  stripe_subscription_id   TEXT UNIQUE             Stripe Subscription ID

  stripe_price_id          TEXT                    Stripe Price ID

  plan_name                TEXT NOT NULL           starter ili pro

  billing_period           TEXT                    monthly ili yearly

  status                   TEXT                    active,canceled,past_due,trialing

  credits_per_period       INTEGER                 1000 ili 2800

  current_period_start     TIMESTAMPTZ             Pocetak trenutnog perioda

  current_period_end       TIMESTAMPTZ             Kraj trenutnog perioda

  cancel_at_period_end     BOOLEAN DEFAULT false   Otkazano na kraj perioda

  created_at               TIMESTAMPTZ             Datum kreiranja

---

**Tabela: credit_transactions**

LOG svake promene kredita. Ovo je tvoja reviziona tabela --- NIKAD ne brisi redove iz nje.

---

  **Kolona**       **Tip**                **Opis**

  id               UUID (PK)              Primarni kljuc

  user_id          UUID (FK → profiles)   Korisnik

  amount           INTEGER NOT NULL       Promena (+1000 ili -1 ili -14 ili -60)

  type             TEXT NOT NULL          subscription_credit,text_gen,image_gen,video_gen,admin_adjustment

  description      TEXT                   Opis transakcije

  reference_id     UUID                   ID generisanog sadrzaja (opciono)

  balance_after    INTEGER                Stanje kredita posle transakcije

  created_at       TIMESTAMPTZ            Datum transakcije

---

**Tabela: generations**

SVE sto je AI generisao --- tekst, slike i video.

---

  **Kolona**         **Tip**                      **Opis**

  id                 UUID (PK)                    Primarni kljuc

  user_id            UUID (FK → profiles)         Korisnik koji je generisao

  brand_id           UUID (FK → brands)           Za koji brend je generisano

  type               TEXT NOT NULL                text, image, ili video

  prompt_text        TEXT                         Tekstualni prompt korisnika

  prompt_image_url   TEXT                         URL uploadovane slike

  result_text        TEXT                         Generisani tekst (za tekst tip)

  result_image_url   TEXT                         URL generisane slike

  result_video_url   TEXT                         URL generisanog videa

  credits_used       INTEGER NOT NULL             Broj utrosenih kredita

  ai_model           TEXT                         Koji AI model je koriscen

  ai_tokens_used     INTEGER                      Broj AI tokena

  status             TEXT DEFAULT completed   pending,completed,failed

  error_message      TEXT                         Poruka o gresci ako je failed

  metadata           JSONB                        Dodatni podaci (dimenzije slike, trajanje videa..)

  created_at         TIMESTAMPTZ                  Datum generisanja

---

**Tabela: webhook_events**

Cuva sve Stripe webhook dogadjaje za idempotentnost --- da se isti dogadjaj ne obradi dva puta.

---

  **Kolona**        **Tip**                 **Opis**

  id                UUID (PK)               Primarni kljuc

  stripe_event_id   TEXT UNIQUE NOT NULL    Stripe Event ID (evt_xxx)

  event_type        TEXT NOT NULL           Tip dogadjaja (npr. invoice.paid)

  payload           JSONB                   Kompletan payload dogadjaja

  processed         BOOLEAN DEFAULT false   Da li je obradjen

  processed_at      TIMESTAMPTZ             Kada je obradjen

  created_at        TIMESTAMPTZ             Kada je primljen

---

**Tabela: admin_logs**

Belezi svaku akciju admina za reviziju.

---

  **Kolona**       **Tip**                **Opis**

  id               UUID (PK)              Primarni kljuc

  admin_id         UUID (FK → profiles)   Admin koji je izvrsio akciju

  action           TEXT NOT NULL          Opis akcije (credit_adjustment,impersonation..)

  target_user_id   UUID                   Korisnik nad kojim je izvrsena akcija

  details          JSONB                  Dodatni detalji akcije

  ip_address       TEXT                   IP adresa admina

  created_at       TIMESTAMPTZ            Datum i vreme akcije

---

**Tabela: rate_limits**

Za pracenje broja zahteva po korisniku.

---

  **Kolona**       **Tip**                **Opis**

  id               UUID (PK)              Primarni kljuc

  user_id          UUID (FK → profiles)   Korisnik

  action           TEXT NOT NULL          Tip akcije (text_gen,image_gen,video_gen)

  window_start     TIMESTAMPTZ            Pocetak vremenskog prozora

  count            INTEGER DEFAULT 1      Broj zahteva u prozoru

---

**1.3 RLS (Row Level Security) politike**

Ovo je NAJVAZNIJI bezbednosni mehanizam u Supabase. Bez RLS-a, svaki korisnik moze da vidi podatke SVIH korisnika.

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **KRITICNO**                                                                                                                                                        |
|                                                                                                                                                                     |
| NIKAD nemoj da ukljucis Supabase tabelu bez RLS-a. Jedan propust = svi podaci svih korisnika su javni. U Cursoru, uvek dodaj RLS politiku odmah nakon CREATE TABLE. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+

- profiles: Korisnik moze da cita i menja SAMO svoj profil (WHERE id = auth.uid())
- brands: Korisnik vidi samo SVOJE brendove (WHERE user_id = auth.uid())
- subscriptions: Korisnik vidi samo SVOJU pretplatu
- generations: Korisnik vidi samo SVOJE generacije
- credit_transactions: Korisnik vidi samo SVOJE transakcije
- Admin politike: role = admin moze da cita SVE tabele

**1.4 API rute --- kompletna mapa**

---

  **Metod**   **Ruta**                  **Opis**                  **Auth**

  POST        /api/generate/text        Generisi tekst post       Da

  POST        /api/generate/image       Generisi sliku            Da

  POST        /api/generate/video       Generisi video            Da

  GET         /api/user/profile         Dohvati profil            Da

  PATCH       /api/user/profile         Azuriraj profil           Da

  GET         /api/user/brands          Dohvati brendove          Da

  POST        /api/user/brands          Dodaj brend               Da

  PATCH       /api/user/brands/id   Azuriraj brend            Da

  DELETE      /api/user/brands/id   Obrisi brend              Da

  GET         /api/user/generations     Istorija generacija       Da

  GET         /api/user/credits         Stanje kredita            Da

  GET         /api/user/analytics       Analitika korisnika       Da

  POST        /api/stripe/checkout      Kreiraj Checkout sesiju   Da

  POST        /api/stripe/portal        Otvori Customer Portal    Da

  POST        /api/webhooks/stripe      Stripe webhook            Stripe sig

  GET         /api/admin/users          Lista korisnika           Admin

  GET         /api/admin/stats          Admin statistike          Admin

  POST        /api/admin/credits        Dodaj/oduzmi kredite      Admin

  POST        /api/admin/impersonate    Uloguj se kao korisnik    Admin

  GET         /api/admin/logs           Admin log                 Admin

---

**1.5 Tok generisanja sadrzaja --- OBAVEZAN redosled**

Svaka API ruta za generisanje MORA da prati ovaj redosled. Bez izuzetaka.

1. Proveri da li je korisnik ulogovan (auth check)
2. Proveri da li korisnik ima aktivnu pretplatu
3. Proveri da li korisnik ima dovoljno kredita
4. Proveri rate limit (max zahteva u minutu)
5. Validiraj korisnikov unos (prompt tekst, sliku)
6. Sanitizuj unos (ukloni potencijalno opasan sadrzaj)
7. Pozovi AI servis sa retry logikom (max 3 pokusaja)
8. Sacuvaj rezultat u bazu (generations tabela)
9. Oduzmi kredite (credit_transactions tabela + azuriraj profiles.credits)
10. Vrati rezultat korisniku

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **KRITICNO: ATOMSKE TRANSAKCIJE**                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                      |
| Koraci 8 i 9 MORAJU biti u istoj transakciji. Ako se rezultat sacuva ali krediti ne oduzmu = korisnik dobija besplatan sadrzaj. Ako se krediti oduzmu ali rezultat ne sacuva = korisnik gubi kredite a ne dobija nista. Koristi Supabase RPC funkciju koja radi oba koraka odjednom. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**FAZA 2: Setup projekta u Cursoru**

**2.1 Inicijalizacija projekta**

Otvori Cursor terminal i ukucaj sledece komande redom:

**Korak 1: Kreiraj Next.js projekat**

npx create-next-app@latest ai-content-studio -typescript -tailwind -eslint -app -src-dir -import-alias @/

**Korak 2: Instaliraj sve zavisnosti**

**Potrebni paketi (ukucaj jednu po jednu komandu):**

 Supabase

npm install supabase/supabase-js supabase/ssr supabase/auth-helpers-nextjs

 Stripe

npm install stripe stripe/stripe-js

 AI servisi

npm install openai google/generative-ai

 UI komponente i pomocni alati

npm install zod react-hot-toast lucide-react date-fns

 Internacionalizacija

npm install next-intl

**Korak 3: Environment varijable (.env.local)**

Kreiraj .env.local fajl u root-u projekta sa sledecim kljucevima:

 Supabase

NEXT_PUBLIC_SUPABASE_URL=tvoj_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_anon_key

SUPABASE_SERVICE_ROLE_KEY=tvoj_service_role_key

 Stripe

STRIPE_SECRET_KEY=sk_test..

STRIPE_WEBHOOK_SECRET=whsec..

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test..

 AI servisi

OPENAI_API_KEY=sk-..

GOOGLE_AI_API_KEY=AIza..

 App

NEXT_PUBLIC_APP_URL=[http://localhost:3000](http://localhost:3000)

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **NIKAD NE STAVLJAJ TAJNE KLJUCEVE U GIT!**                                                                                                                                                              |
|                                                                                                                                                                                                          |
| Dodaj .env.local u .gitignore ODMAH. Ako slucajno push-ujes kljuceve na GitHub, smatraj ih kompromitovanim i generisi nove. Hakeri imaju botove koji skeniraju GitHub za API kljuceve u realnom vremenu. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**2.2 Supabase setup**

Idi na supabase.com, kreiraj novi projekat, i uradi sledece:

- Kopiraj Project URL i anon key u .env.local
- Idi u SQL Editor i pokreni migracije iz sledeece faze
- Ukljuci Email Auth u Authentication  Providers
- Podesi Storage bucket za slike: logos (javni) i uploads (privatni) i generations (privatni)

**2.3 Stripe setup**

- Kreiraj Stripe nalog na stripe.com
- Idi u Developers  API keys i kopiraj kljuceve
- Kreiraj 4 proizvoda (Products) u Stripe dashboard-u:
  - **Starter Monthly** --- 19.99/mesec
  - **Starter Yearly** --- 191.90/godisnje
  - **Pro Monthly** --- 49.99/mesec
  - **Pro Yearly** --- 479.90/godisnje
- Za svaki proizvod, kopiraj Price ID (price_xxx) --- trebace ti u kodu
- Podesi Webhook endpoint: [https://tvoj-domen.com/api/webhooks/stripe](https://tvoj-domen.com/api/webhooks/stripe)
- Selektuj webhook dogadjaje: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted

**FAZA 3: Baza podataka**

U ovoj fazi kreiraes sve tabele, RLS politike i pomocne funkcije u Supabase SQL editoru.

**3.1 SQL migracija --- sta da kazes Cursoru**

U Cursoru, kazi mu: Kreiraj SQL migraciju koja sadrzi sve tabele iz dokumenta FAZA 1.2 sa svim kolonama, indeksima i RLS politikama iz FAZE 1.3. Onda revidiraj SQL pre nego sto ga pokrenes u Supabase.

**3.2 Kriticni indeksi za performanse**

Ovi indeksi su OBAVEZNI jer bez njih upiti ce biti sporni kada imas 1000+ korisnika:

- generations: INDEX na (user_id, created_at DESC) --- za istoriju
- generations: INDEX na (user_id, type) --- za filtriranje
- credit_transactions: INDEX na (user_id, created_at DESC) --- za transakcije
- subscriptions: INDEX na (user_id, status) --- za proveru pretplate
- webhook_events: UNIQUE INDEX na stripe_event_id --- za idempotentnost

**3.3 Supabase RPC funkcije**

Ove PostgreSQL funkcije su OBAVEZNE jer obezbedjuju atomicnost operacija:

**deduct_credits(p_user_id, p_amount, p_type, p_reference_id)**

Atomski oduzima kredite i zapisuje transakciju. Vraca FALSE ako nema dovoljno kredita. Ovo sprecava race condition gde bi dva istovremena zahteva mogla da oduzmu kredite koje korisnik nema.

**add_credits(p_user_id, p_amount, p_description)**

Atomski dodaje kredite (koristi se pri obnovi pretplate i admin podesavanjima).

**reset_monthly_credits(p_user_id, p_credits_amount)**

Resetuje kredite na pocetku novog perioda pretplate (poziva se iz Stripe webhook-a).

**3.4 Supabase Storage konfiguracija**

---

  **Bucket**      **Pristup**      **Max velicina**   **Dozvoljeni tipovi**

  logos           Javni            2MB                image/png, image/jpeg, image/webp, image/svg+xml

  uploads         Privatni (RLS)   10MB               image/png, image/jpeg, image/webp

  generations     Privatni (RLS)   50MB               image/png, image/jpeg, video/mp4

---

**FAZA 4: Autentifikacija**

**4.1 Supabase Auth tok**

Koristimo Supabase Auth sa email + lozinka metodom. Evo kompletnog toka:

1. Korisnik se registruje (email + lozinka + ime)
2. Supabase salje confirmation email
3. Trigger u bazi automatski kreira profil u profiles tabeli
4. Korisnik klikne link u email-u
5. Korisnik se preusmerava na onboarding stranicu
6. Nakon onboarding-a, preusmerava se na pricing stranicu (jer nema pretplatu)
7. Korisnik bira plan i placa
8. Stripe webhook dodaje kredite
9. Korisnik se preusmerava na dashboard

**4.2 Middleware zastita**

Fajl middleware.ts u root-u projekta. Ovaj fajl se izvrsava na SVAKI zahtev pre nego sto stigne do stranice.

- **Javne rute** (bez autentifikacije): /, /login, /register, /reset-password, /api/webhooks/stripe
- **Zastitene rute** (mora biti ulogovan): /dashboard/, /create-/, /history, /analytics, /settings, /onboarding
- **Admin rute** (mora biti admin): /admin/
- **Preusmeravanje**: ako korisnik nije ulogovan i pokusa da pristupi zastitjenoj ruti → preusmerava se na /login
- **Onboarding provera**: ako korisnik JESTE ulogovan ali NIJE zavrsio onboarding → preusmerava se na /onboarding
- **Pretplata provera**: ako korisnik JESTE zavrsio onboarding ali NEMA pretplatu → preusmerava se na pricing stranicu

**4.3 Korisnicke uloge**

---

  **Uloga**   **Moze**                                                           **Ne moze**

  user        Koristi sve generacije, vidi svoju istoriju, upravlja pretplatom   Pristupa admin panelu, vidi tudje podatke

  admin       Sve sto user + admin panel, impersonation, upravljanje kreditima   Nista --- ima pun pristup

---

**FAZA 5: Glavne funkcije --- SAMO BACKEND**

**5.1 API ruta za generisanje teksta (/api/generate/text)**

Ovo je najvaznija ruta. Koristi GPT-5.4 iskljucivo.

**Ulazni parametri (Request Body):**

---

  **Parametar**   **Tip**         **Obavezno**   **Opis**

  prompt_text     string          Ne           Tekstualni prompt korisnika

  prompt_image    File (base64)   Ne           Slika kao prompt

  brand_id        UUID            Da             Za koji brend se generise

  category        string          Da             Izabrana kategorija

  platform        string          Ne             Drustvena mreza (instagram, facebook, linkedin, twitter)

  tone            string          Ne             Ton objave (profesionalni, opusten, humorican)

  language        string          Da             Jezik objave (sr, hr, en)

---

 *Najmanje jedno od prompt_text ili prompt_image je obavezno*

**System prompt za GPT-5.4:**

Ovo je prompt koji se salje AI-ju svaki put. Cursor treba da ga stavi u poseban fajl (src/lib/ai/prompts.ts):

*Ti si ekspert za kreiranje sadrzaja za drustvene mreze. Korisnik posluje u oblasti CATEGORY. Brend se zove BRAND_NAME i poznat je po: TAGLINE. Napravi privlacnu objavu za PLATFORM na LANGUAGE jeziku. Ton treba da bude TONE. Objava treba da bude optimizovana za engagement na drustvenoj mrezi --- ukljuci relevantne hashtag-ove.*

**Retry logika:**

- Pokusaj 1: Pozovi GPT-5.4 sa timeout-om od 30 sekundi
- Pokusaj 2 (ako prvi ne uspe): Sacekaj 2 sekunde, pokusaj ponovo
- Pokusaj 3 (ako drugi ne uspe): Sacekaj 4 sekunde, pokusaj ponovo
- Ako sva tri ne uspeju: Vrati korisniku poruku AI servis je trenutno nedostupan. Pokusajte ponovo za nekoliko minuta. Krediti NISU oduzeti.

**5.2 API ruta za generisanje slike (/api/generate/image)**

Koristi  iskljucivo. Kosta 14 kredita po generisanju.

**Ulazni parametri:**

---

  **Parametar**     **Tip**         **Obavezno**   **Opis**

  prompt_text       string          Da             Opis zeljene slike

  reference_image   File (base64)   Ne             Referentna slika (proizvod)

  brand_id          UUID            Da             Za koji brend

  aspect_ratio      string          Ne             1:1 (Instagram), 16:9 (Facebook), 9:16 (Story)

  style             string          Ne             Stil slike (fotografija, ilustracija, minimalisticki)

---

**5.3 API ruta za generisanje videa (/api/generate/video)**

Koristi Veo-3.1-lite-generate-preview iskljucivo. Kosta 60 kredita po generisanju.

**Ulazni parametri:**

---

  **Parametar**     **Tip**         **Obavezno**   **Opis**

  prompt_text       string          Da             Opis zeljenog videa

  reference_image   File (base64)   Ne             Referentna slika

  brand_id          UUID            Da             Za koji brend

  duration          number          Ne             Trajanje u sekundama (5-15)

  aspect_ratio      string          Ne             16:9 ili 9:16 ili 1:1

---

**5.4 Rate limiting pravila**

---

  **Akcija**                 **Limit**              **Vremenski prozor**

  Generisanje teksta         20 zahteva             Po minutu

  Generisanje slike          5 zahteva              Po minutu

  Generisanje videa          2 zahteva              Po minutu

  Login pokusaji             5 pokusaja             Po 15 minuta

  Registracija               3 pokusaja             Po satu

---

**FAZA 6: Error handling i edge case-ovi**

**6.1 Kompletna lista edge case-ova**

Ovo su SVE situacije koje mogu da krenu naopako. Cursor mora da pokrije SVAKI od ovih scenarija:

**Autentifikacija:**

- Korisnik pokusa da se registruje sa email-om koji vec postoji
- Korisnik unese pogresnu lozinku 5 puta → privremeno zakljucaj nalog
- Korisnik pokusa da pristupi zastitjenoj stranici bez logina
- Sesija istekne dok korisnik koristi aplikaciju → preusmeravanje na login sa porukom
- Korisnik pokusa da potvrdi email sa isteklim linkom

**Krediti i placanje:**

- Korisnik pokusa da generise sadrzaj sa 0 kredita
- Korisnik ima 10 kredita ali pokusa generisanje slike (14 kredita) → jasna poruka
- Dva istovremena zahteva pokusavaju da oduzmu kredite (race condition) → atomska transakcija
- Stripe webhook stigne dva puta (duplikat) → idempotentnost
- Korisnik otkazuje pretplatu ali ima preostale kredite → moze ih koristiti do kraja perioda
- Placanje ne uspe (kartica odbijena) → jasna poruka, ne kreiraj pretplatu
- Korisnik promeni plan (upgrade/downgrade) u sredini perioda

**AI generisanje:**

- AI servis ne odgovori (timeout) → retry 3 puta, NE oduzimaj kredite
- AI servis vrati prazan odgovor → tretiraj kao gresku, NE oduzimaj kredite
- AI servis vrati neprikladan sadrzaj → content moderation filter
- Korisnik upload-uje sliku veccu od 10MB → blokiraj pre upload-a
- Korisnik upload-uje fajl koji nije slika (.exe, .pdf) → blokiraj
- Korisnik duplo klikne dugme GENERISI → debounce, blokiraj drugi zahtev
- Korisnik zatvori browser tokom generisanja → generisanje se zavrsi na serveru, rezultat sacuvaj

**Opste:**

- Korisnik ima los internet → loading state, retry dugme
- Server vrati 500 gresku → prijateljska poruka, ne tehnicka greska
- Baza podataka je nedostupna → maintenance stranica
- Korisnik pokusa SQL injection kroz prompt polje → sanitizacija
- Korisnik pokusa XSS napad kroz ime brenda → escaping

**FAZA 7: Stripe placanje**

**7.1 Kompletni tok placanja**

1. Korisnik klikne na plan na pricing stranici
2. Frontend poziva /api/stripe/checkout sa price_id
3. Backend kreira Stripe Checkout Session i vraca URL
4. Korisnik se preusmerava na Stripe Checkout stranicu
5. Korisnik unese podatke kartice i plati
6. Stripe salje webhook (checkout.session.completed) na /api/webhooks/stripe
7. Backend verifikuje webhook potpis (OBAVEZNO!)
8. Backend proveri da li je event vec obradjen (idempotentnost)
9. Backend kreira/azurira pretplatu u subscriptions tabeli
10. Backend dodaje kredite korisniku
11. Korisnik se vraca na success stranicu

**7.2 Stripe webhook dogadjaji koje moras obraditi**

---

  **Dogadjaj**                    **Akcija**

  checkout.session.completed      Kreiraj pretplatu, dodaj kredite, sacuvaj Stripe Customer ID

  invoice.paid                    Obnovi mesecne kredite (resetuj na pun iznos plana)

  customer.subscription.updated   Azuriraj plan, billing period, status

  customer.subscription.deleted   Oznaci pretplatu kao otkazanu

  invoice.payment_failed          Obavesteni korisnika emailom, oznaci pretplatu kao past_due

---

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **KRITICNO: WEBHOOK BEZBEDNOST**                                                                                                                                                                                          |
|                                                                                                                                                                                                                           |
| UVEK verifikuj Stripe webhook potpis. Bez verifikacije, bilo ko moze da posalje lazni webhook na tvoj endpoint i dodeli sebi besplatne kredite. Koristi stripe.webhooks.constructEvent() sa tvojim STRIPE_WEBHOOK_SECRET. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**7.3 Cenovni planovi --- konfiguracija**

---

  **Plan**    **Mesecno**   **Godisnje**             **Krediti**    **Opis**

  Starter     19.99       191.90 (15.99/mes)   1,000/mesec    Za male biznise

  Pro         49.99       479.90 (39.99/mes)   2,800/mesec    Za aktivne korisnike

---

**7.4 Kreditni sistem --- cene**

---

  **Tip generisanja**   **Krediti**   **AI model**       **Priblizna cena po generisanju**

  Tekst post            1 kredit      GPT-5.4            0.02

  Slika                 14 kredita     Gemini-3.1-pro-preview      0.28

  Video                 60 kredita    Veo-3.1-lite-generate-preview       1.20

---

**FAZA 8: Admin panel**

**8.1 Admin dashboard statistike**

- Ukupan broj korisnika (sa grafikom rasta po mesecima)
- Ukupan broj aktivnih pretplata (Starter vs Pro)
- Mesecni prihod (MRR --- Monthly Recurring Revenue)
- Ukupan broj generacija (tekst/slika/video) sa grafikom
- Prosecna potrosnja kredita po korisniku
- Top 10 korisnika po potrosnji

**8.2 Upravljanje korisnicima**

- Lista svih korisnika sa pretragom po imenu i emailu
- Filtriranje po planu (Starter/Pro/Nema pretplatu)
- Za svakog korisnika: pregled profila, pretplate, kredita, istorije generacija
- Rucno dodavanje/oduzimanje kredita sa obaveznim opisom razloga
- Impersonation --- admin se moze ulogovati kao bilo koji korisnik da vidi sta on vidi
- Blokiranje korisnika (disable nalog)

**8.3 Logovanje admin akcija**

SVAKA admin akcija mora biti logovana u admin_logs tabeli:

- Ko je izvrsio akciju (admin_id)
- Sta je uradjeno (action)
- Nad kim (target_user_id)
- Detalji (koliko kredita dodato/oduzeto, razlog)
- IP adresa
- Datum i vreme

**FAZA 9: Frontend dizajn**

**9.1 Dve teme (Light i Dark)**

**Light tema (osnovna):**

---

  **Element**            **Boja**               **Hex**

  Pozadina               Bela                   #FFFFFF

  Tekst (primarni)       Crna                   #111827

  Tekst (sekundarni)     Siva                   #6B7280

  Akcent/Dugmici         Plava                  #1A56DB

  Akcent hover           Tamnija plava          #1E40AF

  Pozadina kartica       Svetlo siva            #F9FAFB

  Borderi                Svetlo siva            #E5E7EB

  Uspeh                  Zelena                 #059669

  Greska                 Crvena                 #DC2626

  Upozorenje             Narandzasta            #D97706

---

**Dark tema:**

---

  **Element**            **Boja**               **Hex**

  Pozadina               Teget/tamno plava      #0F172A

  Tekst (primarni)       Bela                   #F8FAFC

  Tekst (sekundarni)     Svetlo siva            #94A3B8

  Akcent/Dugmici         Svetlo plava           #3B82F6

  Pozadina kartica       Tamno siva             #1E293B

  Borderi                Tamno siva             #334155

---

**9.2 Pravila za svaku stranicu**

SVAKA stranica u aplikaciji MORA da ima 4 stanja:

- **Loading stanje**: Skeleton loader ili spinner dok se podaci ucitavaju
- **Success stanje**: Normalan prikaz podataka
- **Empty stanje**: Prijateljska poruka kada nema podataka (npr. Jos niste kreirali nijedan post)
- **Error stanje**: Razumljiva poruka sta je krenulo naopako + dugme Pokusaj ponovo

**9.3 Responsive dizajn**

- Mobile first pristup --- prvo dizajniraj za telefon, pa onda za desktop
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar na desktop-u → hamburger meni na mobilnom
- Dugmad: min-height 44px na mobilnom (palac-friendly)
- Tabele: horizontalni scroll na mobilnom

**9.4 UX detalji koji cine razliku**

- Loading spinner na SVAKOM dugmetu koje pokece akciju
- Toast notifikacije za uspesne akcije (Post uspesno kreiran!)
- Konfirmacioni dijalog pre destruktivnih akcija (brisanje brenda, otkazivanje pretplate)
- Kopiranje generisanog teksta jednim klikom (Kopiraj u clipboard dugme)
- Pregled slike u punoj velicini klikom na nju
- Download dugme za generisane slike i video
- Animacije: fade-in za kartice, slide za modalne prozore (koristiti Tailwind transitions)

**FAZA 10: Testiranje**

**10.1 Rucno testiranje --- checklista**

Pre deploy-a, prodi kroz SVAKI od ovih scenarija:

**Registracija i login:**

- Registruj se sa novim email-om → radi
- Registruj se sa postojecim email-om → prikazuje gresku
- Uloguj se sa tacnim podacima → preusmerava na dashboard
- Uloguj se sa pogresnom lozinkom → prikazuje gresku
- Resetuj lozinku → email stize, link radi
- Izloguj se → ne mozes pristupiti zastitjenim stranicama

**Onboarding:**

- Preskoci sve korake → radi (jer su opcioni)
- Popuni sve korake → podaci se sacuvaju
- Dodaj vise brendova → svi se sacuvaju
- Upload-uj logo → prikazuje se ispravno

**Generisanje:**

- Generisi tekst sa samo prompt-om → radi
- Generisi tekst sa samo slikom → radi
- Generisi tekst sa prompt-om i slikom → radi
- Generisi sa 0 kredita → prikazuje poruku o nedovoljnom broju kredita
- Generisi sliku → slika se prikazuje, 14 kredita se oduzima
- Generisi video → video se prikazuje, 60 kredita se oduzima
- Dupli klik na GENERISI → samo jedna generacija

**Placanje:**

- Kupi Starter plan → 1000 kredita se dodaje
- Kupi Pro plan → 2800 kredita se dodaje
- Otkazi pretplatu → moze koristiti do kraja perioda
- Test sa Stripe test karticom 4242 4242 4242 4242
- Test sa odbijenom karticom 4000 0000 0000 0002

**10.2 Stripe test kartice**

---

  **Kartica**                    **Rezultat**

  4242 4242 4242 4242            Uspesno placanje

  4000 0000 0000 0002            Kartica odbijena

  4000 0000 0000 3220            3D Secure autentifikacija

  4000 0000 0000 9995            Nedovoljno sredstava

---

**FAZA 11: Deploy na Vercel**

**11.1 Koraci za deploy**

1. Push-uj kod na GitHub repozitorijum
2. Idi na vercel.com i importuj GitHub repo
3. Podesi environment varijable (SVE iz .env.local ali sa PROD vrednostima)
4. Podesi domen
5. Deploy!

**11.2 PROD vs DEV razdvajanje**

---

  **Stavka**          **DEV**                      **PROD**

  Supabase projekat   Poseban DEV projekat         Poseban PROD projekat

  Stripe kljucevi     sk_test_xxx                  sk_live_xxx

  Domen               localhost:3000               tvoj-domen.com

  AI kljucevi         Isti (ali prati potrosnju)   Isti (ali prati potrosnju)

  Baza                DEV baza sa test podacima    PROD baza sa pravim podacima

---

+------------------------------------------------------------------------------------------------------------+
| **NIKAD NE KORISTI PROD BAZU ZA TESTIRANJE!**                                                              |
|                                                                                                            |
| Jedna pogresna SQL komanda i obrisao si sve podatke pravih korisnika. Uvek imaj potpuno odvojenu DEV bazu. |
+------------------------------------------------------------------------------------------------------------+

**11.3 Post-deploy checklista**

- SSL sertifikat aktivan (Vercel ga automatski daje)
- Stripe webhook URL azuriran na PROD domen
- Environment varijable postavljene u Vercel dashboard-u
- Supabase Auth redirect URL azuriran na PROD domen
- Testiraj registraciju sa PRAVIM email-om
- Testiraj placanje u Stripe LIVE modu sa pravom karticom
- Proveri da sajt radi na mobilnom telefonu
- Proveri da OG tagovi rade (podeli link na Facebooku/LinkedInu)

**Kako da koristis Cursor za ovaj projekat**

**Opsta pravila za rad sa Cursorom**

- **Radi fazu po fazu.** Nikad ne trazi od Cursora da napravi celu aplikaciju odjednom. Kazi mu Radi samo FAZU 3 i sacekaj da zavrsi.
- **Daj mu kontekst.** Pre svake faze, daj Cursoru ovaj dokument (ili relevantan deo) kao kontekst. Sto vise informacija mu das, bolji rezultat dobijas.
- **Revidiraj SVE sto napravi.** Cursor nije savesen --- moze da napravi gresku, propusti edge case, ili koristi zastareo pristup. Uvek pitaj Da li si pokrio sve edge case-ove?
- **Testiraj odmah.** Posle svake faze, testiraj u browseru pre nego sto predjes na sledecu. Greske se gomilaju.
- **Koristi .cursorrules fajl.** Kreiraj .cursorrules u root-u projekta sa pravilima: Uvek koristi TypeScript strict mode, Uvek validiraj inpute sa Zod, Nikad ne ostavljaj console.log u produkciji itd.

**Internacionalizacija (i18n)**

Aplikacija mora podrzavati srpski, hrvatski i engleski jezik. Korisnik bira jezik u podesavanjima.

**Implementacija sa next-intl**

- Svi tekstovi u aplikaciji dolaze iz JSON fajlova (sr.json, hr.json, en.json)
- Nikad hardkodiraj tekst direktno u komponenti --- uvek koristi t(kljuc) funkciju
- Cuva se u profiles.language koloni u bazi
- Menja se u Settings stranici
- AI generisani sadrzaj treba da bude na jeziku koji korisnik izabere za post, ne na jeziku interfejsa

**Primer strukture sr.json:**

{ dashboard: { title: Kontrolna tabla, credits: Preostali krediti, create_text: Kreiraj tekst }, generate: { button: Generisi, loading: Generisanje u toku.., no_credits: Nemate dovoljno kredita } }

**Finalna checklista pre lansiranja**

**Bezbednost**

- RLS ukljucen na SVIM tabelama
- Environment varijable postavljene (nijedna nije hardkodirana)
- Stripe webhook potpis se verifikuje
- Rate limiting aktivan na svim API rutama
- Input validacija sa Zod na svim formama
- CORS pravilno podesen
- Nema console.log sa osetljivim podacima u produkciji

**Funkcionalnost**

- Registracija radi
- Login radi
- Reset lozinke radi
- Onboarding radi (sva 3 koraka)
- Generisanje teksta radi
- Generisanje slike radi
- Generisanje videa radi
- Krediti se ispravno oduzimaju
- Placanje radi (Stripe LIVE mod)
- Admin panel radi
- Istorija prikazuje sve generacije
- Analitika prikazuje statistike

**Pravne stranice**

- Privacy Policy objavljena
- Terms of Service objavljeni
- Cookie obaveštenje implementirano

**Performanse**

- Lighthouse skor  80 za sve stranice
- Slike kompresovane
- Lazy loading za teze komponente

**Monitoring**

- Sentry podesen za error tracking
- Uptime monitoring aktivan
- Stripe webhook monitoring aktivan

**Ovaj dokument pokriva SVE sto je potrebno za izgradnju AI Content Studio SI aplikacije. Radi fazu po fazu, testiraj svaku pre nego sto predjes na sledecu, i ne preskaci korake. Srecno sa razvojem!**