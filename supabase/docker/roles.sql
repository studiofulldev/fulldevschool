-- =============================================================================
-- roles.sql — Configuração de senhas dos roles Supabase para dev local
-- =============================================================================
-- Este arquivo é montado em /etc/postgresql.schema.sql e executado
-- pelo migrate.sh da imagem supabase/postgres após a inicialização.
--
-- Configura as senhas dos roles de serviço usados pelo GoTrue (auth)
-- e PostgREST (rest) para conectar ao banco.
--
-- ATENÇÃO: valores estáticos de desenvolvimento — NÃO usar em produção.
-- =============================================================================

-- Senha do role authenticator (usado pelo PostgREST para conectar)
ALTER ROLE authenticator      WITH LOGIN PASSWORD 'postgres';

-- Senha do role supabase_auth_admin (usado pelo GoTrue para conectar)
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';

-- Senha do role postgres (superusuário)
ALTER ROLE postgres            WITH LOGIN PASSWORD 'postgres';
