-- Tabela de eventos de analytics — alimenta o painel admin.
-- Projetada para ser agnóstica de provider: o TrackingService insere aqui
-- independente de qual EventTrackingProvider estiver ativo.

CREATE TABLE IF NOT EXISTS events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT        NOT NULL,
  properties JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_user_id_idx    ON events (user_id);
CREATE INDEX IF NOT EXISTS events_event_name_idx ON events (event_name);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem inserir apenas os próprios eventos.
CREATE POLICY "authenticated users can insert own events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ler todos os eventos para alimentar o painel.
CREATE POLICY "admins can read all events"
  ON events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
