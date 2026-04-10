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
--     psql "$DATABASE_URL" -f supabase/migrations/20260410000002_create_user_progress.sql
--
-- Run AFTER 20260410000001_create_profiles_and_leads.sql (depends on auth.users).
-- Idempotent: uses CREATE TABLE IF NOT EXISTS — safe to re-run.
-- =============================================================

-- Migration: create user_progress table with RLS
-- Stores lesson/module/course completion per user.
-- localStorage is used as an immediate cache (UX responsiveness);
-- this table is the server-side source of truth — Supabase wins on conflict.

-- ============================================================
-- TABLE: user_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug  text NOT NULL,
  lesson_slug  text,
  module_slug  text,
  type         text NOT NULL CHECK (type IN ('lesson', 'module', 'course')),
  completed    bool NOT NULL DEFAULT true,
  completed_at timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  -- A user can only have one progress record per (course, lesson, module, type) combination
  UNIQUE (user_id, course_slug, lesson_slug, module_slug, type)
);

-- ============================================================
-- RLS: user_progress
-- ============================================================
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress: user reads own rows"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress: user inserts own rows"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress: user updates own rows"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
