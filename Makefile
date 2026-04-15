# =============================================================================
# Fulldev School — Comandos de desenvolvimento e testes locais
# =============================================================================
# Único pré-requisito:
#   - Docker Desktop (https://www.docker.com/products/docker-desktop)
#
# Comandos principais:
#   make setup         Configura o ambiente local pela primeira vez
#   make up            ★ Sobe TUDO: Supabase (db+auth+rest+kong+studio) + app Angular
#   make down          Para e remove todos os containers (dados persistem)
#   make logs          Exibe os logs de todos os serviços
#   make db-reset      Recria o banco do zero e reaplica migrations + seed
#   make docker-build  Builda a imagem Docker do app Angular
#   make serve         Inicia o dev server Angular (sem Docker)
#   make test          Executa os testes unitários
#   make test-watch    Executa os testes em modo watch
#   make test-coverage Executa os testes com relatório de cobertura

.PHONY: setup up down logs db-reset \
        docker-build \
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
	@echo "── Copiando runtime-config local..."
	@if [ ! -f $(APP_DIR)/public/runtime-config.js ]; then \
	  cp $(APP_DIR)/public/runtime-config.local.js.example $(APP_DIR)/public/runtime-config.js; \
	  echo "    ✅  $(APP_DIR)/public/runtime-config.js criado."; \
	  echo ""; \
	  echo "    ℹ️   O arquivo já está configurado com as credenciais locais Docker."; \
	  echo "        URL: http://localhost:8000  (Kong API gateway)"; \
	  echo "        Não é necessário editar — pronto para uso."; \
	else \
	  echo "    ℹ️   $(APP_DIR)/public/runtime-config.js já existe — não sobrescrito."; \
	fi
	@echo ""
	@echo "✅  Setup concluído. Próximo passo: make up"

# =============================================================================
# Ponto de entrada principal — sobe tudo com um único comando
# =============================================================================
#
# 100% Docker — sem dependência do Supabase CLI.
# O postgres inicializa schemas, roles, migrations e seed automaticamente
# na primeira vez que o volume db-data está vazio.
#
# Serviços que sobem:
#   db       → PostgreSQL 15 (porta 5433 no host)
#   auth     → GoTrue / Supabase Auth (interno, roteado pelo Kong)
#   rest     → PostgREST (interno, roteado pelo Kong)
#   kong     → API Gateway (porta 8000 — URL que o browser usa)
#   meta     → postgres-meta (usado pelo Studio)
#   studio   → Supabase Studio (porta 3000)
#   inbucket → Servidor de e-mail local (porta 54324)
#   app      → Angular via nginx (porta 4200)

up: ## ★ Sobe TUDO: Supabase + app Angular (ponto de entrada recomendado)
	@echo "════════════════════════════════════════════════════"
	@echo "  Fulldev School — Ambiente de desenvolvimento"
	@echo "════════════════════════════════════════════════════"
	@echo ""
	@echo "── Verificando pré-requisitos..."
	@docker info > /dev/null 2>&1 || \
	  (echo "❌  Docker não encontrado ou não está rodando." && \
	   echo "    Instale o Docker Desktop: https://www.docker.com/products/docker-desktop" && exit 1)
	@if [ ! -f $(APP_DIR)/public/runtime-config.js ]; then \
	  echo "❌  runtime-config.js não encontrado. Execute: make setup" && exit 1; \
	fi
	@echo "    OK"
	@echo ""
	@echo "── Subindo serviços Supabase + app..."
	@echo "    Na primeira execução o banco será inicializado (migrations + seed)."
	@echo "    Pode levar 1-2 minutos enquanto as imagens são baixadas."
	@echo ""
	docker compose up -d --build
	@echo ""
	@echo "── Aguardando os serviços ficarem prontos..."
	@docker compose wait db auth kong 2>/dev/null || true
	@echo ""
	@echo "════════════════════════════════════════════════════"
	@echo "  ✅  Ambiente pronto!"
	@echo ""
	@echo "  App Angular:      http://localhost:4200"
	@echo "  Supabase API:     http://localhost:8000   (Kong gateway)"
	@echo "  Supabase Studio:  http://localhost:3000"
	@echo "  PostgreSQL:       localhost:5433"
	@echo "  Email (Inbucket): http://localhost:54324"
	@echo ""
	@echo "  Logs:             make logs"
	@echo "  Parar tudo:       make down"
	@echo "  Resetar banco:    make db-reset"
	@echo "════════════════════════════════════════════════════"

down: ## Para e remove todos os containers (volume do banco é preservado)
	@echo "── Parando e removendo containers..."
	docker compose down
	@echo ""
	@echo "✅  Containers parados. Volume do banco preservado."
	@echo "    Para apagar o banco também: docker compose down -v"

logs: ## Exibe os logs de todos os serviços (Ctrl+C para sair)
	docker compose logs -f

# =============================================================================
# Reset do banco de dados
# =============================================================================
#
# Remove o volume do banco e recria do zero.
# As migrations e o seed são reaplicados automaticamente na próxima subida.
#
# Útil quando:
#   - Uma migration mudou e o banco local está desatualizado
#   - O banco ficou em estado inconsistente
#   - Você quer começar do zero

db-reset: ## Recria o banco do zero e reaplica migrations + seed
	@echo "════════════════════════════════════════════════════"
	@echo "  ⚠️   db-reset: todos os dados locais serão apagados"
	@echo "════════════════════════════════════════════════════"
	@echo ""
	@echo "── Parando containers..."
	docker compose down -v
	@echo ""
	@echo "── Removendo volume do banco..."
	docker volume rm fulldevschool-db-data 2>/dev/null || true
	@echo ""
	@echo "── Subindo novamente (migrations + seed serão reaplicados)..."
	docker compose up -d db auth rest kong meta studio inbucket
	@echo ""
	@echo "── Aguardando o banco estar pronto..."
	@for i in $$(seq 1 30); do \
	  docker compose exec db pg_isready -U postgres -d postgres > /dev/null 2>&1 && break; \
	  printf "."; \
	  sleep 2; \
	done
	@echo ""
	@echo "✅  Banco recriado. Suba o app com: make up"

# =============================================================================
# Docker — build do app Angular
# =============================================================================

docker-build: ## Builda a imagem Docker do app (nginx + build de produção)
	docker compose build app

# =============================================================================
# Angular dev server (sem Docker)
# =============================================================================

serve: ## Inicia o servidor de desenvolvimento Angular (porta 4200, sem Docker)
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
