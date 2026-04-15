#!/bin/bash
# =============================================================================
# init-db.sh — Aplica migrations e seed do projeto ao banco Supabase
# =============================================================================
#
# Executado pelo serviço db-migrate (container separado, restart: no).
# Conecta ao serviço db (PostgreSQL) depois que ele está healthy e aplica:
#   1. Migrations em ordem alfanumérica (= ordem dos timestamps)
#   2. seed.sql
#
# Idempotência:
#   As migrations usam "CREATE TABLE IF NOT EXISTS", "CREATE POLICY IF NOT EXISTS"
#   e "DO $$ IF NOT EXISTS $$" — seguras para re-executar (make db-reset recria
#   o volume do zero, então idempotência aqui é para casos de falha parcial).
#
# Variáveis de ambiente esperadas:
#   PGPASSWORD   → senha do postgres (default: postgres)
# =============================================================================

set -euo pipefail

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDB="${PGDB:-postgres}"

echo "════════════════════════════════════════════════════"
echo "  db-migrate — Aplicando migrations do projeto"
echo "════════════════════════════════════════════════════"
echo ""
echo "  Banco: postgres://$PGUSER@$PGHOST:$PGPORT/$PGDB"
echo ""

# Aguarda o banco estar aceitando conexões (safety net além do healthcheck)
echo "── Verificando conectividade com o banco..."
for i in $(seq 1 30); do
  pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" > /dev/null 2>&1 && break
  echo "    Aguardando banco ($i/30)..."
  sleep 2
done

pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" > /dev/null 2>&1 || {
  echo "❌  Banco não respondeu após 60s. Abortando."
  exit 1
}
echo "    ✅  Banco disponível."
echo ""

# Função auxiliar para executar SQL
psql_run() {
  PGPASSWORD="${PGPASSWORD:-postgres}" psql \
    -v ON_ERROR_STOP=1 \
    --no-password \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDB" \
    "$@"
}

# =============================================================================
# Migrations
# =============================================================================
echo "── [1/2] Aplicando migrations..."

MIGRATIONS_DIR="/migrations"

if [ -d "$MIGRATIONS_DIR" ] && ls "$MIGRATIONS_DIR"/*.sql > /dev/null 2>&1; then
  for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    filename=$(basename "$migration")
    echo "    → $filename"
    psql_run -f "$migration" || {
      echo "    ❌  Falha na migration: $filename"
      exit 1
    }
    echo "    ✅  $filename aplicada."
  done
  echo ""
  echo "    ✅  Todas as migrations aplicadas."
else
  echo "    ℹ️   Nenhuma migration encontrada em $MIGRATIONS_DIR — pulando."
fi

echo ""

# =============================================================================
# Seed
# =============================================================================
echo "── [2/2] Aplicando seed.sql..."

SEED_FILE="/seed.sql"

if [ -f "$SEED_FILE" ]; then
  psql_run -f "$SEED_FILE"
  echo "    ✅  seed.sql aplicado."
else
  echo "    ℹ️   seed.sql não encontrado — pulando."
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅  Migrations concluídas com sucesso!"
echo "════════════════════════════════════════════════════"
