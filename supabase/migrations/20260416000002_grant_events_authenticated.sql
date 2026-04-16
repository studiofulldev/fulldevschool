-- Garante grants explícitos para a tabela events.
-- A migration anterior (20260416000001) criou a tabela mas não adicionou
-- grants explícitos, contando apenas com os DEFAULT PRIVILEGES. Em alguns
-- ambientes Supabase o role que executa a migration difere do 'postgres',
-- o que faz os default privileges não se aplicarem automaticamente.

GRANT SELECT, INSERT ON TABLE public.events TO authenticated;
GRANT ALL             ON TABLE public.events TO service_role;
