# Runbook

Use these commands from the repository root unless noted otherwise.

## Setup
- `pnpm install` – Install all project dependencies; completes without warnings for a ready-to-build workspace.

## Development
- `pnpm dev` – Start Vite in extension dev mode; serves popup/options with hot reload for local tweaks.

## Quality
- `pnpm lint` – Run ESLint across the project; exits cleanly when all files pass lint rules.

## Build & Packaging
- `pnpm build` – Produce the production extension bundle in `dist/`; required before loading the unpacked build in Chrome.
- `pnpm zip` – Package the latest `dist/` output into `./artifacts/delayo.zip`; ready for manual distribution or store upload.

## Testing The Build
1. Run `pnpm build`.
2. In Chrome, open `chrome://extensions`, enable Developer Mode, choose **Load unpacked**, and select the `dist/` folder – the extension loads with the current build.