# =============================================================================
# Fulldev School — Comandos de desenvolvimento e testes locais
# =============================================================================
# Requisitos:
#   - Docker Desktop (https://www.docker.com/products/docker-desktop)
#   - Supabase CLI  (https://supabase.com/docs/guides/cli)
#     Instalar: brew install supabase/tap/supabase
#
# Comandos principais:
#   make setup           Configura o ambiente local pela primeira vez
#   make up              ★ Sobe TUDO: Supabase + app Angular (ponto de entrada recomendado)
#   make down            Para tudo: app + Supabase
#   make supabase-start  Inicia o Supabase local (Docker) isoladamente
#   make supabase-stop   Para o Supabase local
#   make supabase-reset  Reseta o banco e aplica seed.sql
#   make supabase-status Mostra URLs e credenciais locais
#   make docker-build    Builda a imagem Docker do app
#   make docker-up       Sobe o app em Docker (nginx na porta 4200)
#   make docker-down     Para e remove os containers do app
#   make docker-logs     Exibe os logs do container do app
#   make serve           Inicia o dev server Angular (sem Docker)
#   make test            Executa os testes unitários
#   make test-watch      Executa os testes em modo watch
#   make test-coverage   Executa os testes com relatório de cobertura

.PHONY: setup up down \
        supabase-start supabase-stop supabase-reset supabase-status \
        docker-build docker-up docker-down docker-logs \
        serve test test-watch test-coverage \
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
	@echo "✅  Setup concluído. Próximo passo: make up"

# =============================================================================
# Ponto de entrada principal — sobe tudo com um único comando
# =============================================================================
#
# Estratégia escolhida: wrapper script (Opção C)
#
# Por quê não as outras opções:
#   - Opção A (serviços Supabase no docker-compose): exigiria manter ~10 services
#     com variáveis de ambiente, imagens e redes manualmente. Cada release do Supabase
#     CLI quebraria a configuração. Alto custo de manutenção.
#   - Opção B (Supabase CLI dentro de container): requer Docker-in-Docker — frágil,
#     lento e exige privilégios elevados no daemon Docker.
#   - Opção C (wrapper no Makefile): usa o Supabase CLI oficial que já gerencia toda
#     a complexidade dos serviços. Migrations e seed são aplicados automaticamente.
#     Um único comando para o dev. Backward compatible com quem já usa supabase start.

up: ## ★ Sobe TUDO: Supabase local + app Angular (ponto de entrada recomendado)
	@echo "════════════════════════════════════════════"
	@echo "  Fulldev School — Ambiente de desenvolvimento"
	@echo "════════════════════════════════════════════"
	@echo ""
	@echo "── [1/3] Verificando pré-requisitos..."
	@supabase --version > /dev/null 2>&1 || \
	  (echo "❌  Supabase CLI não encontrado. Instale com: brew install supabase/tap/supabase" && exit 1)
	@if [ ! -f $(APP_DIR)/public/runtime-config.js ]; then \
	  echo "❌  runtime-config.js não encontrado. Execute: make setup" && exit 1; \
	fi
	@echo "    OK"
	@echo ""
	@echo "── [2/3] Iniciando Supabase local (migrations + seed serão aplicados automaticamente)..."
	@echo "    Pode levar alguns minutos na primeira execução..."
	@echo ""
	@# Verifica se já está rodando para evitar mensagens de erro desnecessárias
	@if supabase status 2>/dev/null | grep -q "API URL"; then \
	  echo "    ℹ️   Supabase já está rodando — pulando."; \
	else \
	  supabase start; \
	fi
	@echo ""
	@echo "── [3/3] Subindo app Angular (porta 4200)..."
	@echo ""
	docker compose up -d app
	@echo ""
	@echo "════════════════════════════════════════════"
	@echo "  ✅  Ambiente pronto!"
	@echo ""
	@echo "  App Angular:      http://localhost:4200"
	@echo "  Supabase API:     http://localhost:54321"
	@echo "  Supabase Studio:  http://localhost:54323"
	@echo "  Email (Inbucket): http://localhost:54324"
	@echo ""
	@echo "  Logs do app:      make docker-logs"
	@echo "  Parar tudo:       make down"
	@echo "════════════════════════════════════════════"

down: ## Para tudo: app Angular + Supabase local
	@echo "── Parando app Angular..."
	docker compose down
	@echo ""
	@echo "── Parando Supabase local..."
	supabase stop
	@echo ""
	@echo "✅  Tudo parado."

# =============================================================================
# Supabase local — comandos isolados (backward compatible)
# =============================================================================

supabase-start: ## Inicia o Supabase local via Docker (aplica migrations automaticamente)
	supabase start

supabase-stop: ## Para os containers do Supabase local
	supabase stop

supabase-reset: ## Reseta o banco e reaplica migrations + seed.sql
	supabase db reset

supabase-status: ## Mostra URLs e credenciais do Supabase local
	supabase status

# =============================================================================
# Docker — app Angular (comandos isolados, backward compatible)
# =============================================================================

docker-build: ## Builda a imagem Docker do app (nginx + build de produção)
	docker compose build app

docker-up: ## Sobe o app em Docker na porta 4200 (requer runtime-config.js e Supabase já rodando)
	docker compose up -d app

docker-down: ## Para e remove os containers do app
	docker compose down

docker-logs: ## Exibe os logs do container do app
	docker compose logs -f app

# =============================================================================
# Angular dev server (sem Docker)
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
