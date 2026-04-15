-- Restrict anon role database access.
--
-- Background: the Supabase JS client is initialized with the anon/publishable
-- key, but that key is only used as the PostgREST API key — it does NOT grant
-- meaningful database access. All app operations require a signed-in user
-- (JWT in the Authorization header → `authenticated` role).
--
-- The initial schema migration used Supabase defaults which grant ALL to anon.
-- This is safe today because every RLS policy is scoped to `authenticated`,
-- but it creates a fragile safety net: a future policy written without
-- `TO "authenticated"` would accidentally expose data to anonymous callers.
-- Removing the grants eliminates that risk entirely.
--
-- Anonymous sign-ins are also disabled in supabase/config.toml
-- (enable_anonymous_sign_ins = false), so there are no legitimate anon sessions
-- that need row-level access.

-- 1. Revoke table grants from anon.
REVOKE ALL ON TABLE "public"."leads"          FROM "anon";
REVOKE ALL ON TABLE "public"."profiles"       FROM "anon";
REVOKE ALL ON TABLE "public"."user_progress"  FROM "anon";

-- Restore explicit grants for authenticated and service_role only.
GRANT SELECT, INSERT, UPDATE         ON TABLE "public"."leads"         TO "authenticated";
GRANT SELECT, INSERT, UPDATE         ON TABLE "public"."profiles"      TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."user_progress" TO "authenticated";

GRANT ALL ON TABLE "public"."leads"          TO "service_role";
GRANT ALL ON TABLE "public"."profiles"       TO "service_role";
GRANT ALL ON TABLE "public"."user_progress"  TO "service_role";

-- 2. Revoke function grants from anon (covers current_profile_role and set_updated_at).
REVOKE ALL ON FUNCTION "public"."current_profile_role"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_updated_at"()       FROM "anon";

-- 3. Fix default privileges so future objects created by postgres do not
--    automatically become accessible to anon.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM "anon";

-- Ensure authenticated and service_role retain full default access.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT ALL ON SEQUENCES TO "service_role";
