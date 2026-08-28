# LangState docs

This app contains the Mintlify documentation site for LangState.

## Development

From the repository root:

```bash
pnpm install
pnpm dev:docs
```

The root launcher selects an available host port and prints the URL. Running `pnpm dev` directly from this directory uses Mintlify's default local port.

Or from this directory directly:

```bash
pnpm dev
```

The docs configuration and pinned implementation variables live in `docs.json`.

## Validation

From the repository root, with Node 20.17.0 and pnpm 10.18.0:

```bash
pnpm docs:validate
pnpm docs:links
pnpm docs:a11y
pnpm docs:structure
pnpm docs:source-smoke
```

## Deployment

Configure the Mintlify project's monorepo documentation path as `/apps/docs` with no trailing slash.
