-- Social links + mentor points on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS github_username  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS linkedin_url     TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url    TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url      TEXT,
  ADD COLUMN IF NOT EXISTS mentor_points    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviewer_level   TEXT NOT NULL DEFAULT 'dev_em_formacao';

CREATE INDEX IF NOT EXISTS idx_profiles_github_username
  ON profiles(github_username)
  WHERE github_username IS NOT NULL;

-- PR submissions posted by users for community review
CREATE TABLE IF NOT EXISTS pr_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_pr_url    TEXT NOT NULL,
  repo_owner       TEXT NOT NULL,
  repo_name        TEXT NOT NULL,
  pr_number        INTEGER NOT NULL,
  pr_title         TEXT,
  pr_body          TEXT,
  repo_language    TEXT,
  pr_state         TEXT NOT NULL DEFAULT 'open',
  review_count     INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  github_synced_at TIMESTAMPTZ,
  UNIQUE(repo_owner, repo_name, pr_number)
);

-- Reviews fetched from GitHub API (cached)
CREATE TABLE IF NOT EXISTS pr_reviews_cache (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_submission_id      UUID NOT NULL REFERENCES pr_submissions(id) ON DELETE CASCADE,
  github_reviewer_login TEXT NOT NULL,
  review_state          TEXT,
  reviewed_at           TIMESTAMPTZ,
  reviewer_user_id      UUID REFERENCES auth.users(id),
  mp_credited           BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(pr_submission_id, github_reviewer_login)
);

-- PR author endorses a review as useful (triggers +10 MP for reviewer)
CREATE TABLE IF NOT EXISTS pr_review_endorsements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_submission_id   UUID NOT NULL REFERENCES pr_submissions(id) ON DELETE CASCADE,
  pr_review_cache_id UUID NOT NULL REFERENCES pr_reviews_cache(id) ON DELETE CASCADE,
  endorsed_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pr_review_cache_id, endorsed_by)
);

-- Audit log for mentor points transactions
CREATE TABLE IF NOT EXISTS mentor_points_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  points       INTEGER NOT NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE pr_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_reviews_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_review_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_points_log ENABLE ROW LEVEL SECURITY;

-- pr_submissions: authenticated users can read all active; owner can insert/update their own
CREATE POLICY "pr_submissions_select_authenticated"
  ON pr_submissions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "pr_submissions_insert_own"
  ON pr_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_submissions_update_own"
  ON pr_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- pr_reviews_cache: authenticated users can read; only service role can write
CREATE POLICY "pr_reviews_cache_select_authenticated"
  ON pr_reviews_cache FOR SELECT
  TO authenticated
  USING (true);

-- pr_review_endorsements: authenticated can read all; owner can insert their own
CREATE POLICY "pr_review_endorsements_select_authenticated"
  ON pr_review_endorsements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pr_review_endorsements_insert_own"
  ON pr_review_endorsements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = endorsed_by);

-- mentor_points_log: user can only read their own; no direct insert (edge function writes via service role)
CREATE POLICY "mentor_points_log_select_own"
  ON mentor_points_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
