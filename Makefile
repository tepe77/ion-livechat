.PHONY: help setup up down restart logs build test test-backend test-frontend migrate seed dev clean

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup (copy env, install dependencies, build packages)
	@cp -n .env.example .env || true
	@cd packages/types && npm install && npm run build
	@cd apps/api && composer install
	@cd apps/web && npm install
	@echo "Setup complete. Run 'make up' to start the application."

up: ## Start all services using Docker Compose
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: down up ## Restart all services

logs: ## View container logs
	docker compose logs -f

build: ## Build all Docker containers
	docker compose build

test: test-backend test-frontend ## Run all backend and frontend test suites

test-backend: ## Run Laravel Pest/PHPUnit tests
	cd apps/api && php artisan test

test-frontend: ## Run frontend type checks and production build
	cd apps/web && npm run build

migrate: ## Run database migrations
	docker compose exec api php artisan migrate --force

seed: ## Run database seeders
	docker compose exec api php artisan db:seed --force

tinker: ## Open Laravel Tinker interactive shell
	docker compose exec api php artisan tinker

dev: ## Start development stack with volume mounts
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

clean: ## Remove containers, volumes, and temporary files
	docker compose down -v --remove-orphans
