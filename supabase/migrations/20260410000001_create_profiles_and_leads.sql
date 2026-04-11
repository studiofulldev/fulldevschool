-- =============================================================
-- MANUAL MIGRATION — must be applied by hand in production
-- =============================================================
-- How to apply:
--   Option A (Supabase CLI):
--     supabase db push
--   Option B (Supabase dashboard):
--     1. Go to your project → SQL Editor
--     2. Paste this entire file and click Run
--   Option C (psql direct):
--     psql "$DATABASE_URL" -f supabase/migrations/20260410000001_create_profiles_and_leads.sql
--
-- Run ONCE per environment (local, staging, production).
-- Idempotent: uses CREATE TABLE IF NOT EXISTS — safe to re-run.
-- =============================================================

-- Migration: create profiles and leads tables with RLS
-- Profiles mirror auth.users data for fast queries without hitting auth schema.
-- Role source of truth: user_metadata.app_role in Supabase Auth.
-- profiles.role is a denormalized copy written through by the application
-- (write-through cache pattern) so that SQL queries against profiles can
-- filter by role without joining auth.users. Always keep them in sync.

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text NOT NULL,
  full_name             text,
  whatsapp_number       text,
  age                   int,
  technical_level       text CHECK (technical_level IN ('iniciante', 'intermediario', 'avancado')),
  education_institution text,
  avatar_url            text,
  provider              text,
  -- Denormalized copy of auth.users.user_metadata->>'app_role'.
  -- Source of truth is user_metadata; this field is kept in sync via application
  -- write-through so SQL queries can filter by role without touching auth schema.
  role                  text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'instructor', 'admin')),
  accepted_terms        bool NOT NULL DEFAULT false,
  accepted_terms_at     timestamptz,
  updated_at            timestamptz DEFAULT now()
);

-- ============================================================
-- RLS: profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles: user reads own row"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "profiles: user inserts own row"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles: user updates own row"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- service_role bypasses RLS by default in Supabase (no explicit policy needed),
-- but we document it here for clarity: admin operations use the service_role key.

-- ============================================================
-- TABLE: leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  email       text PRIMARY KEY,
  name        text,
  provider    text,
  profile_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- RLS: leads
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads are internal marketing data — only accessible via service_role key.
-- No policies are created for authenticated users; service_role bypasses RLS.
-- This intentionally prevents any authenticated user from reading lead data
-- through the anon/user key.
