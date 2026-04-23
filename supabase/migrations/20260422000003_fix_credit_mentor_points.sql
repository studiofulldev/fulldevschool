-- Fix credit_mentor_points: the INSERT was missing the `action` column (NOT NULL),
-- causing a silent failure on every call. ON CONFLICT also referenced `reason` instead
-- of the actual unique index columns (user_id, action, reference_id).

CREATE OR REPLACE FUNCTION public.credit_mentor_points(
  p_user_id     uuid,
  p_points      integer,
  p_reason      text,
  p_reference_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO mentor_points_log (user_id, action, points, reason, reference_id)
  VALUES (p_user_id, p_reason, p_points, p_reason, p_reference_id)
  ON CONFLICT (user_id, action, reference_id) DO NOTHING;

  IF FOUND THEN
    UPDATE profiles
    SET mentor_points = COALESCE(mentor_points, 0) + p_points
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Drop the text-argument overload — only the uuid variant is used.
DROP FUNCTION IF EXISTS public.credit_mentor_points(uuid, integer, text, text);
