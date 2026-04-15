-- Add DELETE policy to user_progress for LGPD right-to-erasure (Art. 18, VI).
--
-- SELECT, INSERT and UPDATE policies already exist. DELETE was missing,
-- which means users cannot remove their own progress records.
-- Admins can still delete any row using the service_role key (bypasses RLS).

CREATE POLICY "user_progress_delete_own"
  ON public.user_progress
  FOR DELETE
  USING (auth.uid() = user_id);
