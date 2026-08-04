.PHONY: help build serve test parity verify install all

help: ## Show this help
	@echo "Tiny Vector Drawable - available commands:"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

build: ## Build the avocado optimizer bundle
	npm run build

serve: ## Serve locally over http (for ES modules + SW)
	npm run serve

test: ## Run the unit tests
	npm test

parity: ## Run the parity test against committed fixtures
	npm run test:parity

verify: ## Run unit tests then the parity test
	npm run test:all

install: ## Install dependencies
	npm install

all: install build verify ## Install, build, and verify everything
