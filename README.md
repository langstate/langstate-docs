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

Run the homepage locally:

```bash
pnpm dev:homepage
```

If your local Node version is below Mintlify's minimum requirement, run both apps in containers instead:

```bash
pnpm docker:up
```

Or start them independently:

```bash
pnpm docker:up:homepage
pnpm docker:up:docs
```

Ports:

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

VS Code tasks are also included in [tasks.json](/Users/liqingpan/Projects/langstate-docs/.vscode/tasks.json#L1) for running both app servers as named background tasks.

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
