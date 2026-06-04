# ANSI color codes
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
BLUE=\033[0;34m
RESET=\033[0m

.DEFAULT_GOAL := help

### Help
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Rename Tab : Make targets$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "; category=""} \
		/^### / {category = substr($$0, 5); next} \
		/^[a-zA-Z_-]+:.*?## / { \
			if (category != last_category) { \
				if (last_category != "") print ""; \
				print "$(GREEN)" category ":$(RESET)"; \
				last_category = category; \
			} \
			printf "  $(YELLOW)%-12s$(RESET) %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)

check_bun:
	@command -v bun > /dev/null 2>&1 || { echo "$(RED)bun is not installed.$(RESET)"; exit 1; }

### Setup
.PHONY: setup
setup: check_bun ## Install extension dependencies
	@cd extension && bun install

.PHONY: githooks
githooks: ## Install git hooks with prek
	@bun install -g @j178/prek && prek install

### Develop
.PHONY: dev
dev: check_bun ## Vite + crxjs in watch mode with HMR (then load extension/dist unpacked)
	@cd extension && bun run dev

.PHONY: build
build: check_bun ## Production build to extension/dist
	@cd extension && bun run build

.PHONY: zip
zip: check_bun ## Build and package extension/rename-tab.zip for the Web Store
	@cd extension && bun run zip

### Code Quality
.PHONY: fmt
fmt: check_bun ## Format with Biome (auto-fix)
	@bunx biome check --write

.PHONY: lint
lint: check_bun ## Lint with Biome (check only)
	@bunx biome check

.PHONY: typecheck
typecheck: check_bun ## Typecheck the extension (tsc --noEmit)
	@cd extension && bun run typecheck

.PHONY: check_ai_writing
check_ai_writing: check_bun ## Fail on em dashes (AI-writing tell)
	@bun run scripts/check_ai_writing.ts

.PHONY: ci
ci: lint typecheck check_ai_writing ## Run all checks
	@echo "$(GREEN)✅ CI checks completed.$(RESET)"
