.PHONY: dev-docs dev-homepage dev-all check-docs build-homepage

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
