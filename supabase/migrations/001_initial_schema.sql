-- ============================================================
-- AI Content Studio SI — Inicijalna migracija
-- Faza 3: Baza podataka
-- ============================================================

-- ============================================================
-- 1. TABELE
-- ============================================================

-- ------------------------------------------------------------
-- profiles (proširuje auth.users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  email                TEXT        NOT NULL,
  role                 TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url           TEXT,
  language             TEXT        NOT NULL DEFAULT 'sr' CHECK (language IN ('sr', 'hr', 'en')),
  theme                TEXT        NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  onboarding_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  credits              INTEGER     NOT NULL DEFAULT 0 CHECK (credits >= 0),
  stripe_customer_id   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- brands
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  logo_url         TEXT,
  company_logo_url TEXT,
  tagline          TEXT,
  categories       TEXT[]      DEFAULT '{}',
  is_default       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        UNIQUE,
  stripe_price_id        TEXT,
  plan_name              TEXT        NOT NULL CHECK (plan_name IN ('starter', 'pro')),
  billing_period         TEXT        CHECK (billing_period IN ('monthly', 'yearly')),
  status                 TEXT        NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  credits_per_period     INTEGER,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- credit_transactions (audit log — nikad ne brisati redove)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       INTEGER     NOT NULL,
  type         TEXT        NOT NULL
               CHECK (type IN (
                 'subscription_credit',
                 'text_gen',
                 'image_gen',
                 'video_gen',
                 'admin_adjustment'
               )),
  description  TEXT,
  reference_id UUID,
  balance_after INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- generations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id          UUID        REFERENCES public.brands(id) ON DELETE SET NULL,
  type              TEXT        NOT NULL CHECK (type IN ('text', 'image', 'video')),
  prompt_text       TEXT,
  prompt_image_url  TEXT,
  result_text       TEXT,
  result_image_url  TEXT,
  result_video_url  TEXT,
  credits_used      INTEGER     NOT NULL,
  ai_model          TEXT,
  ai_tokens_used    INTEGER,
  status            TEXT        NOT NULL DEFAULT 'completed'
                                CHECK (status IN ('pending', 'completed', 'failed')),
  error_message     TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- webhook_events (idempotentnost Stripe webhook-ova)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT        UNIQUE NOT NULL,
  event_type      TEXT        NOT NULL,
  payload         JSONB,
  processed       BOOLEAN     NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- admin_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action         TEXT        NOT NULL,
  target_user_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  details        JSONB,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- rate_limits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action       TEXT        NOT NULL
               CHECK (action IN ('text_gen', 'image_gen', 'video_gen')),
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INTEGER     NOT NULL DEFAULT 1
);

-- ============================================================
-- 2. INDEKSI ZA PERFORMANSE (Faza 3.2)
-- ============================================================

-- generations: istorija po korisniku
CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON public.generations (user_id, created_at DESC);

-- generations: filtriranje po tipu
CREATE INDEX IF NOT EXISTS idx_generations_user_type
  ON public.generations (user_id, type);

-- credit_transactions: istorija transakcija
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

-- subscriptions: provera aktivne pretplate
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions (user_id, status);

-- webhook_events: idempotentnost (UNIQUE index)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_webhook_events_stripe_event_id
  ON public.webhook_events (stripe_event_id);

-- rate_limits: brzo traženje po korisniku i akciji
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_window
  ON public.rate_limits (user_id, action, window_start);

-- brands: korisnikovi brendovi
CREATE INDEX IF NOT EXISTS idx_brands_user_id
  ON public.brands (user_id);

-- admin_logs: pregled po adminu
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id
  ON public.admin_logs (admin_id, created_at DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY (Faza 1.3)
-- ============================================================

-- Uključi RLS na svim tabelama
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits         ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
CREATE POLICY "User can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "User can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Service role (backend) može da insertuje novi profil
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- brands
-- ------------------------------------------------------------
CREATE POLICY "User can read own brands"
  ON public.brands FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "User can insert own brands"
  ON public.brands FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can update own brands"
  ON public.brands FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can delete own brands"
  ON public.brands FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admin can read all brands"
  ON public.brands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
CREATE POLICY "User can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can read all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- credit_transactions
-- ------------------------------------------------------------
CREATE POLICY "User can read own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can read all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert credit transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- generations
-- ------------------------------------------------------------
CREATE POLICY "User can read own generations"
  ON public.generations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "User can insert own generations"
  ON public.generations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can update own generations"
  ON public.generations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admin can read all generations"
  ON public.generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- webhook_events (samo service role pristupa)
-- ------------------------------------------------------------
CREATE POLICY "Service role manages webhook events"
  ON public.webhook_events FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- admin_logs (samo admin čita, service role piše)
-- ------------------------------------------------------------
CREATE POLICY "Admin can read admin logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert admin logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- rate_limits (service role upravlja)
-- ------------------------------------------------------------
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "User can read own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 4. TRIGGER — automatski kreira profil pri registraciji
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. RPC FUNKCIJE (Faza 3.3)
-- ============================================================

-- ------------------------------------------------------------
-- deduct_credits — atomski oduzima kredite i beleži transakciju
-- Vraća FALSE ako nema dovoljno kredita (race condition zaštita)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_type        TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description  TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_balance_after   INTEGER;
BEGIN
  -- Zaključaj red da sprečimo race condition
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  v_balance_after := v_current_credits - p_amount;

  -- Oduzmi kredite
  UPDATE public.profiles
  SET credits    = v_balance_after,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Zapiši transakciju (audit log)
  INSERT INTO public.credit_transactions
    (user_id, amount, type, description, reference_id, balance_after)
  VALUES
    (p_user_id, -p_amount, p_type, p_description, p_reference_id, v_balance_after);

  RETURN TRUE;
END;
$$;

-- ------------------------------------------------------------
-- add_credits — atomski dodaje kredite i beleži transakciju
-- Koristi se pri obnovi pretplate i admin podešavanjima
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_type       TEXT DEFAULT 'subscription_credit',
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_after INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits    = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_balance_after;

  INSERT INTO public.credit_transactions
    (user_id, amount, type, description, balance_after)
  VALUES
    (p_user_id, p_amount, p_type, p_description, v_balance_after);

  RETURN v_balance_after;
END;
$$;

-- ------------------------------------------------------------
-- reset_monthly_credits — resetuje kredite na početku perioda
-- Poziva se iz Stripe webhook-a (invoice.paid)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(
  p_user_id       UUID,
  p_credits_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_after INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits    = p_credits_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_balance_after;

  INSERT INTO public.credit_transactions
    (user_id, amount, type, description, balance_after)
  VALUES
    (
      p_user_id,
      p_credits_amount,
      'subscription_credit',
      'Mesečni reset kredita',
      v_balance_after
    );

  RETURN v_balance_after;
END;
$$;

-- ============================================================
-- 6. STORAGE BUCKET KONFIGURACIJA (Faza 3.4)
-- ============================================================

-- logos — javan bucket za logoe brendova (max 2 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  TRUE,
  2097152,  -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- uploads — privatan bucket za slike koje korisnik upload-uje (max 10 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  FALSE,
  10485760,  -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- generations — privatan bucket za AI generisane slike i video (max 50 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  FALSE,
  52428800,  -- 50 MB
  ARRAY['image/png', 'image/jpeg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — uploads bucket
CREATE POLICY "User can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "User can read own uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "User can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Storage RLS — generations bucket
CREATE POLICY "User can read own generations"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generations'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Service role can manage generation files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'generations')
  WITH CHECK (bucket_id = 'generations');

-- Storage RLS — logos bucket (javni bucket, slobodan upload za auth korisnike)
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can read logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');
