---
name: codeql-fix
description: Run CodeQL security/quality analysis and fix findings. Use when the user asks to run CodeQL, security scan, static analysis, or fix CodeQL findings.
compatibility: Requires [CodeQL CLI](https://github.com/github/codeql-cli-binaries/releases) on PATH (e.g. brew install codeql). Node.js per [`.node-version`](../../../.node-version) and pnpm per [`package.json`](../../../package.json) `packageManager`. Run `pnpm install` before `database create` so TypeScript and workspace resolution match the tree. Matches local flow in [`scripts/codeql.sh`](scripts/codeql.sh) and [`.github/workflows/codeql.yml`](../../../.github/workflows/codeql.yml) when present.
---

# CodeQL Fix

Use when the user asks to run CodeQL or static analysis, or to fix CodeQL findings (see frontmatter `description`).

## Preconditions

- [CodeQL CLI](https://github.com/github/codeql-cli-binaries/releases) on `PATH` (e.g. `brew install codeql`).
- **Node** and **pnpm** as in this repo; run **`pnpm install`** before creating the database (use **`pnpm install --frozen-lockfile`** for CI-like reproducibility).

## Run analysis (repository root)

All commands below assume `cd "$(git rev-parse --show-toplevel)"`.

Do not commit CodeQL databases or SARIF outputs (large, machine-specific). They belong in [`.gitignore`](../../../.gitignore) (for example `.codeql_db/`, `codeql-results.sarif`).

### 1. Preferred: `scripts/codeql.sh`

```bash
pnpm run codeql:local
```

Or:

```bash
./.claude/skills/codeql-fix/scripts/codeql.sh
```

This runs **`pnpm install`**, renders **`paths-ignore`** via [`scripts/render-code-scanning-config.sh`](scripts/render-code-scanning-config.sh) (excludes `coverage/`, `node_modules/`, `packages/*/dist`, etc.), creates **`.codeql_db`** with **`javascript-typescript`**, analyzes with **`codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls`**, writes **`codeql-results.sarif`**, and passes **`--download`** to resolve query packs.

Do **not** pass **`--command`** for JavaScript/TypeScript-only database creation; it can prevent the normal extractor from running. Rely on `pnpm install` plus the extractor. Use **`pnpm build`** (for example via **build-and-fix** or the verifier) when you need a clean compile before other work; it is not required here for CodeQL DB creation in this template.

### 2. Manual CLI (equivalent to the script)

After **`pnpm install`**, prefer **`pnpm run codeql:local`** so generated trees are excluded. Manual create without `paths-ignore` may flag artifacts under `coverage/`.

```bash
REPO="$(git rev-parse --show-toplevel)"
"${REPO}/.claude/skills/codeql-fix/scripts/render-code-scanning-config.sh" "${REPO}" /tmp/codeql-config.yml
codeql database create .codeql_db --language=javascript-typescript --source-root . \
  --codescanning-config=/tmp/codeql-config.yml --overwrite
```

Analyze and emit SARIF:

```bash
codeql database analyze .codeql_db \
  "codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls" \
  --format=sarif-latest \
  --output=codeql-results.sarif \
  --download
```

- For a narrower suite closer to default GitHub code scanning, use `codeql/javascript-queries:codeql-suites/javascript-code-scanning.qls` instead.
- If packs are missing and you are not using `--download`, run `codeql pack download codeql/javascript-queries` once.

View SARIF in the VS Code SARIF extension (or upload where your org uses code scanning).

### 3. Optional: code scanning config (`paths-ignore`)

Use the renderer when you want `paths-ignore` for large or generated trees, hand-edited query blocks, or parity with GitHub code scanning YAML.

```bash
REPO="$(git rev-parse --show-toplevel)"
"${REPO}/.claude/skills/codeql-fix/scripts/render-code-scanning-config.sh" "${REPO}" /tmp/codeql-config.yml
codeql database create .codeql_db --language=javascript-typescript --source-root . \
  --codescanning-config=/tmp/codeql-config.yml --overwrite
```

Then run `codeql database analyze` as in section 2. See [references/code-scanning-config.md](references/code-scanning-config.md). Template: [`assets/code-scanning-config.template.yml`](assets/code-scanning-config.template.yml).

## Fixer loop

If the relevant SARIF has an empty `runs[].results` array, there are **no CodeQL alerts to fix** for that suite; stop unless the user wants a broader suite or diagnostic queries.

When SARIF findings remain:

1. **Identify:** Read the SARIF or CLI output for reported findings.
2. **Fix:** Apply the minimum necessary edit to resolve each finding.
3. **Verify:** From the repository root, run **`pnpm test`**, then **`pnpm lint`** (see [AGENTS.md](../../../AGENTS.md)). Dependency CVEs: run **`pnpm lint:security`** ([`security-scan`](../security-scan/SKILL.md)); clean SARIF does not imply a clean lockfile.
4. **Re-scan:** Run **`pnpm run codeql:local`** or repeat the manual create + analyze steps until clean or up to 3 iterations to avoid unbounded loops.

## Optional: code scanning config details

See [references/code-scanning-config.md](references/code-scanning-config.md) and the official [code scanning configuration](https://aka.ms/code-scanning-docs/config-file) reference.
