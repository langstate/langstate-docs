# LangState Site Monorepo

This repository now contains two independently deployable apps:

- `apps/docs`: the Mintlify documentation site
- `apps/homepage`: the Next.js homepage / marketing site

## Install

```bash
pnpm install
```

## Local development

Run the docs locally:

```bash
pnpm dev:docs
```

From a normal host shell, the root dev scripts automatically pick open host ports, persist them in `.dev/dev-ports.env`, and point the homepage at the matching docs URL.

If Docker is available, `pnpm dev:docs` uses Docker Compose so Mintlify can keep its internal `3000` port while publishing on a free external host port.

Run the homepage locally:

```bash
pnpm dev:homepage
```

If Docker is available, `pnpm dev:homepage` uses the same shared port selection and injects `NEXT_PUBLIC_DOCS_URL` for the chosen docs host port.

Default host port preferences:

- Homepage: `3000`
- Docs: `3001`

If you want to force the next launch to pick a new free pair, run:

```bash
pnpm dev:ports:reset
```

The same Docker fallback is used for the docs validation tasks exposed through `pnpm check:docs` and `pnpm validate:docs:deploy`.

If your local Node version is below Mintlify's minimum requirement, run both apps in containers instead:

```bash
pnpm docker:up
```

Or start them independently:

```bash
pnpm docker:up:homepage
pnpm docker:up:docs
```

Docker Compose host ports:

- Homepage: `http://localhost:3000`
- Docs: `http://localhost:3001`

If either host port is already occupied, override it at startup:

```bash
DOCS_PORT=3101 HOMEPAGE_PORT=3100 pnpm docker:up
```

## Dev Container

This repo also includes a VS Code dev container in [`.devcontainer/README.md`](/Users/liqingpan/Projects/langstate-docs/.devcontainer/README.md) so you can work inside Node `20.17` without depending on the host runtime.

After reopening the repo in the container, use:

```bash
pnpm dev:docs
pnpm dev:homepage
```

Or use the repo `Makefile`:

```bash
make dev-docs
make dev-homepage
```

VS Code tasks are also included in [tasks.json](/Users/liqingpan/Projects/langstate-docs/.vscode/tasks.json#L1) for running both app servers, launching both together, and running deploy-oriented checks.

Expected ports in the container:

- Docs: `3000`
- Homepage: `3001`

## Deployment

### Docs (`apps/docs`)

The docs app is still Mintlify. Configure the docs deployment so the documentation root is `apps/docs`, where `docs.json` now lives.

### Homepage (`apps/homepage`)

Deploy the homepage as a separate Vercel project with the root directory set to `apps/homepage`.

If the homepage needs to link to the live docs site, set:

```bash
NEXT_PUBLIC_DOCS_URL=https://docs.your-domain.com
```
