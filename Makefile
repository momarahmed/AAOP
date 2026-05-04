# =====================================================================
# AAOP — developer Makefile
# All targets are thin wrappers over `docker compose` so the local stack
# is easy to drive without remembering long flag combinations.
# =====================================================================

DC ?= docker compose

.DEFAULT_GOAL := help

# ---------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n\033[1mUsage:\033[0m\n  make \033[36m<target>\033[0m\n\n\033[1mTargets:\033[0m\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

.PHONY: env
env: ## Create root .env from .env.example if it doesn't exist yet
	@if [ ! -f .env ]; then cp .env.example .env && echo "wrote .env"; else echo ".env already present"; fi

.PHONY: ports
ports: env ## Auto-pick safe host ports (per dev-env.txt §41-47) and persist them in .env
	@./scripts/pick-ports.sh

.PHONY: ports-print
ports-print: env ## Show what ports would be chosen without writing .env
	@./scripts/pick-ports.sh --print

.PHONY: up
up: ports ## Build and start the full stack (frontend + backend + mysql + redis + mailpit)
	$(DC) up -d --build
	@$(MAKE) --no-print-directory open

.PHONY: up-fg
up-fg: ports ## Same as `up` but keep all logs in the foreground
	$(DC) up --build

.PHONY: down
down: ## Stop the stack (keeps named volumes)
	$(DC) down

.PHONY: ps
ps: ## Show running services
	$(DC) ps

.PHONY: logs
logs: ## Tail combined logs from all services
	$(DC) logs -f --tail=200

.PHONY: restart
restart: ## Restart every service
	$(DC) restart

.PHONY: restart-backend
restart-backend: ## Restart the Laravel container
	$(DC) restart backend queue

.PHONY: restart-frontend
restart-frontend: ## Restart the Next.js container
	$(DC) restart frontend

.PHONY: stack-clean
stack-clean: ## Stop, remove containers AND named volumes (destructive — wipes DB)
	$(DC) down -v

# ---------------------------------------------------------------------
# Shells
# ---------------------------------------------------------------------

.PHONY: sh-backend
sh-backend: ## Bash shell inside the backend container
	$(DC) exec backend bash

.PHONY: sh-frontend
sh-frontend: ## Sh shell inside the frontend container (as dev — keeps .next writable)
	$(DC) exec -u dev frontend sh

.PHONY: sh-mysql
sh-mysql: ## MySQL CLI inside the database container
	$(DC) exec mysql sh -lc 'mysql -uaaop -paaopsecret aaop'

.PHONY: sh-redis
sh-redis: ## redis-cli inside the cache container
	$(DC) exec redis redis-cli

# ---------------------------------------------------------------------
# Backend tasks (Laravel)
# ---------------------------------------------------------------------

.PHONY: artisan
artisan: ## Run an artisan command — usage: `make artisan ARGS="route:list"`
	$(DC) exec backend php artisan $(ARGS)

.PHONY: migrate
migrate: ## Run pending migrations
	$(DC) exec backend php artisan migrate

.PHONY: fresh
fresh: ## DROP and re-create the schema, then seed (DEV ONLY)
	$(DC) exec backend php artisan migrate:fresh --seed

.PHONY: seed
seed: ## Run the database seeders
	$(DC) exec backend php artisan db:seed

.PHONY: tinker
tinker: ## Interactive Laravel REPL
	$(DC) exec backend php artisan tinker

.PHONY: composer
composer: ## Run composer — usage: `make composer ARGS="require vendor/pkg"`
	$(DC) exec backend composer $(ARGS)

.PHONY: test
test: ## Run Pest tests inside the backend container
	$(DC) exec backend php artisan test

# ---------------------------------------------------------------------
# Frontend tasks (Next.js)
# ---------------------------------------------------------------------

.PHONY: npm
npm: ## Run npm — usage: `make npm ARGS="install"`
	$(DC) exec -u dev frontend npm $(ARGS)

.PHONY: lint
lint: ## Lint the frontend
	$(DC) exec -u dev frontend npm run lint

.PHONY: build-frontend
build-frontend: ## Build the production Next.js bundle inside the container
	$(DC) exec -u dev frontend npm run build

# ---------------------------------------------------------------------
# Convenience
# ---------------------------------------------------------------------

.PHONY: open
open: ## Print the most useful URLs (reads chosen ports from .env)
	@set -a; [ -f .env ] && . ./.env; set +a; \
	  fp="$${FRONTEND_HOST_PORT:-3000}"; \
	  bp="$${BACKEND_HOST_PORT:-8000}";  \
	  dp="$${DB_HOST_PORT:-3306}";       \
	  rp="$${REDIS_HOST_PORT:-6379}";    \
	  mu="$${MAILPIT_UI_PORT:-8025}";    \
	  ms="$${MAILPIT_SMTP_PORT:-1025}";  \
	  echo ""; \
	  echo "  Frontend     http://127.0.0.1:$${fp}"; \
	  echo "  Backend API  http://127.0.0.1:$${bp}"; \
	  echo "  Health       http://127.0.0.1:$${bp}/api/health"; \
	  echo "  Mailpit UI   http://127.0.0.1:$${mu}"; \
	  echo "  MySQL        127.0.0.1:$${dp}"; \
	  echo "  Redis        127.0.0.1:$${rp}"; \
	  echo "  Mailpit SMTP 127.0.0.1:$${ms}"; \
	  echo ""
