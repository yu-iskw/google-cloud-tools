# google-cloud-tools

Independent **npm packages** for Google Cloud workflows, developed in a single pnpm workspace. Shared TypeScript, Vitest, Trunk, and CI live at the repo root; each package under `packages/` has its own version, README, and publish lifecycle.

## Packages

| Package                            | npm          | Description                                                                           |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| [bq-inspect](packages/bq-inspect/) | `bq-inspect` | Read-only BigQuery job and metadata inspection CLI/library for automation and agents. |

Install a package from npm (example):

```bash
npx bq-inspect --help
```

Develop in this repo: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Getting started (repository)

### Prerequisites

- [pnpm](https://pnpm.io/) v11+
- Node.js (see [`.node-version`](.node-version))

Linting and formatting use [Trunk](https://trunk.io/) via project dependencies.

### Installation

```bash
pnpm install
```

Optional: prefetch Trunk's hermetic tools (helpful for offline work or CI images):

```bash
pnpm exec trunk install
```

If you prefer a global `trunk` on your PATH, see the [Trunk installation guide](https://docs.trunk.io/references/cli/getting-started/install) (e.g. `brew install trunk-io` on macOS).

### Supply-chain protections

pnpm 11 settings in [`pnpm-workspace.yaml`](pnpm-workspace.yaml): a **7-day** [`minimumReleaseAge`](https://pnpm.io/settings#minimumreleaseage) (10080 minutes), [`blockExoticSubdeps`](https://pnpm.io/settings#blockexoticsubdeps) enabled, and an [`allowBuilds`](https://pnpm.io/settings#allowbuilds) map for dependencies that must run install scripts. See the [pnpm 11 release notes](https://pnpm.io/blog/releases/11.0).

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Linting and formatting

```bash
pnpm lint
pnpm format
```

## Project structure

```text
google-cloud-tools/
├── packages/           # publishable workspace packages
│   └── bq-inspect/     # BigQuery inspection CLI/library
├── AGENTS.md           # instructions for coding agents
├── CONTRIBUTING.md     # contributor guide (workspace)
└── .github/workflows/  # CI
```

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) — workspace setup and PR gates.
Package guides: [bq-inspect](packages/bq-inspect/CONTRIBUTING.md).

## License

Apache-2.0 — see [LICENSE](LICENSE).
