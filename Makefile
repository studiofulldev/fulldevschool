# =============================================================================
# Fulldev School — Comandos de desenvolvimento e testes locais
# =============================================================================
# Requisitos:
#   - Docker Desktop (https://www.docker.com/products/docker-desktop)
#   - Supabase CLI  (https://supabase.com/docs/guides/cli)
#     Instalar: brew install supabase/tap/supabase
#
# Comandos principais:
#   make setup          Configura o ambiente local pela primeira vez
#   make start          Inicia o Supabase local + serve Angular
#   make test           Executa os testes unitários
#   make test-watch     Executa os testes em modo watch
#   make test-coverage  Executa os testes com relatório de cobertura
#   make supabase-start Inicia apenas o Supabase local
#   make supabase-stop  Para o Supabase local
#   make supabase-reset Reseta o banco e aplica seed.sql
#   make supabase-status Mostra URLs e credenciais locais

.PHONY: setup start test test-watch test-coverage \
        supabase-start supabase-stop supabase-reset supabase-status \
        help

APP_DIR = fulldev-school/app

# =============================================================================
# Setup inicial
# =============================================================================

setup: ## Configura o ambiente local pela primeira vez
	@echo "── Instalando dependências do Angular app..."
	cd $(APP_DIR) && npm install
	@echo ""
	@echo "── Verificando Supabase CLI..."
	@supabase --version || (echo "\n❌  Supabase CLI não encontrado." && \
	  echo "    Instale com: brew install supabase/tap/supabase" && exit 1)
	@echo ""
	@echo "── Copiando runtime-config local..."
	@if [ ! -f $(APP_DIR)/public/runtime-config.js ]; then \
	  cp $(APP_DIR)/public/runtime-config.local.js.example $(APP_DIR)/public/runtime-config.js; \
	  echo "    ✅  $(APP_DIR)/public/runtime-config.js criado."; \
	else \
	  echo "    ℹ️   $(APP_DIR)/public/runtime-config.js já existe — não sobrescrito."; \
	fi
	@echo ""
	@echo "✅  Setup concluído. Próximo passo: make supabase-start"

# =============================================================================
# Supabase local
# =============================================================================

supabase-start: ## Inicia o Supabase local via Docker
	supabase start

supabase-stop: ## Para os containers do Supabase local
	supabase stop

supabase-reset: ## Reseta o banco e reaplica migrations + seed.sql
	supabase db reset

supabase-status: ## Mostra URLs e credenciais do Supabase local
	supabase status

# =============================================================================
# Angular dev server
# =============================================================================

serve: ## Inicia o servidor de desenvolvimento Angular
	cd $(APP_DIR) && npm start

# =============================================================================
# Testes
# =============================================================================

test: ## Executa os testes unitários (Vitest, single run)
	cd $(APP_DIR) && npm test

test-watch: ## Executa os testes em modo watch
	cd $(APP_DIR) && npx ng test --watch

test-coverage: ## Executa os testes com relatório de cobertura (v8)
	cd $(APP_DIR) && npx ng test --coverage

# =============================================================================
# Help
# =============================================================================

help: ## Lista todos os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
