-- ============================================================
-- Faza 8: Dodaj is_blocked kolonu na profiles tabelu
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
