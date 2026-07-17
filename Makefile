.PHONY: help build serve test parity install all

help: ## Show this help
	@echo "Tiny Vector Drawable - available commands:"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

build: ## Build the avocado optimizer bundle
	npm run build

serve: ## Serve locally over http (for ES modules + SW)
	npm run serve

test: ## Run the parity test against avocado CLI
	npm run test:parity

parity: test ## Alias for test

install: ## Install dependencies
	npm install

all: install build test ## Install, build, and verify
