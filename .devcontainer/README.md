# Dev Container

This project includes a VS Code dev container so the workspace runs on Node `20.17`, which satisfies Mintlify's runtime requirement.

## Included

- Node `20.17`
- `pnpm 10.18.0`
- Global `mint` CLI
- Port forwarding for:
  - `3000` docs
  - `3001` homepage

## Usage

1. Open the repository in VS Code.
2. Run `Dev Containers: Reopen in Container`.
3. After the post-create setup completes, start either app from the terminal:

```bash
pnpm dev:homepage
pnpm dev:docs
```

You can also run them from VS Code tasks:

- `Docs: Dev`
- `Homepage: Dev`
- `Dev: Both`

The workspace also recommends the `Task Buttons` extension so these tasks can be launched directly from the VS Code status bar.

The apps are independent and can be run separately.

Expected ports inside the dev container:

- Docs: `3000`
- Homepage: `3001`

Use the VS Code `Ports` panel if the browser does not open automatically.
