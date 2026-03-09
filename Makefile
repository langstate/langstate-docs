.PHONY: dev-docs dev-homepage dev-all check-docs build-homepage validate-docs-deploy deploy-homepage-preview

dev-docs:
	pnpm dev:docs

dev-homepage:
	pnpm dev:homepage

dev-all:
	@printf "Run these in separate terminals:\n"
	@printf "  make dev-docs\n"
	@printf "  make dev-homepage\n"

check-docs:
	pnpm check:docs

build-homepage:
	pnpm build:homepage

validate-docs-deploy:
	pnpm --filter @langstate/docs exec mint validate
	pnpm check:docs

deploy-homepage-preview:
	cd apps/homepage && vercel deploy -y
