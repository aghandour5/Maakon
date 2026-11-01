-- Run with the schema owner, after applying the application schema.
-- New roles stay NOLOGIN until their password and activation are authorized.
-- The role is trusted by Express, which owns per-user authorization.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('maakon_runtime_role_setup'));

DO $setup$
DECLARE
  runtime pg_roles%ROWTYPE;
BEGIN
  SELECT * INTO runtime FROM pg_roles WHERE rolname = 'maakon_api';
  IF NOT FOUND THEN
    CREATE ROLE maakon_api NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    COMMENT ON ROLE maakon_api IS 'Maakon API runtime role; managed by lib/db/sql/runtime-role.sql';
  ELSE
    IF shobj_description(runtime.oid, 'pg_authid') IS DISTINCT FROM
       'Maakon API runtime role; managed by lib/db/sql/runtime-role.sql' THEN
      RAISE EXCEPTION 'Existing maakon_api role is not managed by this configuration';
    END IF;
    IF runtime.rolsuper OR runtime.rolcreatedb OR runtime.rolcreaterole
       OR runtime.rolreplication OR runtime.rolbypassrls OR runtime.rolinherit THEN
      RAISE EXCEPTION 'Existing maakon_api role has unexpected elevated attributes';
    END IF;
  END IF;

  SELECT * INTO runtime FROM pg_roles WHERE rolname = 'maakon_api';
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = runtime.oid)
     OR EXISTS (SELECT 1 FROM pg_class WHERE relowner = runtime.oid) THEN
    RAISE EXCEPTION 'maakon_api must not own relations or belong to other roles';
  END IF;
  IF has_database_privilege('maakon_api', current_database(), 'CREATE')
     OR has_schema_privilege('maakon_api', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'Inherited database/schema CREATE privileges must be reviewed before configuring maakon_api';
  END IF;
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO maakon_api', current_database());
END
$setup$;

ALTER ROLE maakon_api SET search_path = pg_catalog, public;
GRANT USAGE ON SCHEMA public TO maakon_api;

-- Reset only this managed role's ACLs; never revoke other roles or PUBLIC.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM maakon_api;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM maakon_api;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.users, public.posts, public.ngos, public.reports, public.sessions
  TO maakon_api;
-- Existing user deletion removes actions authored by that user (DB-12).
GRANT SELECT, INSERT, DELETE ON TABLE public.admin_actions TO maakon_api;
GRANT INSERT ON TABLE public.feedbacks TO maakon_api;
GRANT USAGE ON SEQUENCE
  public.users_id_seq, public.posts_id_seq, public.ngos_id_seq,
  public.reports_id_seq, public.sessions_id_seq, public.admin_actions_id_seq,
  public.feedbacks_id_seq TO maakon_api;

-- No automatic access to future tables, unused verification requests, waitlist,
-- Supabase Auth/Storage schemas, persistent DDL, TRUNCATE, or grant options.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maakon_api_access ON public.users;
CREATE POLICY maakon_api_access ON public.users FOR ALL TO maakon_api
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS maakon_api_access ON public.posts;
CREATE POLICY maakon_api_access ON public.posts FOR ALL TO maakon_api
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS maakon_api_access ON public.ngos;
CREATE POLICY maakon_api_access ON public.ngos FOR ALL TO maakon_api
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS maakon_api_access ON public.reports;
CREATE POLICY maakon_api_access ON public.reports FOR ALL TO maakon_api
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS maakon_api_access ON public.sessions;
CREATE POLICY maakon_api_access ON public.sessions FOR ALL TO maakon_api
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS maakon_api_select ON public.admin_actions;
CREATE POLICY maakon_api_select ON public.admin_actions FOR SELECT TO maakon_api USING (true);
DROP POLICY IF EXISTS maakon_api_insert ON public.admin_actions;
CREATE POLICY maakon_api_insert ON public.admin_actions FOR INSERT TO maakon_api WITH CHECK (true);
DROP POLICY IF EXISTS maakon_api_delete ON public.admin_actions;
CREATE POLICY maakon_api_delete ON public.admin_actions FOR DELETE TO maakon_api USING (true);
DROP POLICY IF EXISTS maakon_api_insert ON public.feedbacks;
CREATE POLICY maakon_api_insert ON public.feedbacks FOR INSERT TO maakon_api WITH CHECK (true);
COMMIT;
