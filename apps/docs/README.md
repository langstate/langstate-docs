# LangState Docs

This app contains the Mintlify documentation site for LangState.

## Development

From the repository root:

```bash
pnpm install
pnpm dev:docs
```

Mintlify serves the local preview on `http://localhost:3000`.

Or from this directory directly:

```bash
pnpm dev
```

The docs configuration lives in `docs.json`.

## Deployment

Configure the Mintlify docs project so its content root is this directory: `apps/docs`.
