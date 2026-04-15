-- Migration: create user_progress table with RLS
-- Stores lesson/module/course completion per user.
-- localStorage is used as an immediate cache (UX responsiveness);
-- this table is the server-side source of truth — Supabase wins on conflict.

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
  UNIQUE (user_id, course_slug, lesson_slug, module_slug, type)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
