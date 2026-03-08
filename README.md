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

## Deployment

### Docs (`apps/docs`)

The docs app is still Mintlify. Configure the docs deployment so the documentation root is `apps/docs`, where `docs.json` now lives.

### Homepage (`apps/homepage`)

Deploy the homepage as a separate Vercel project with the root directory set to `apps/homepage`.

If the homepage needs to link to the live docs site, set:

```bash
NEXT_PUBLIC_DOCS_URL=https://docs.your-domain.com
```
