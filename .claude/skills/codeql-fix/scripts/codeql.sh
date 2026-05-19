#!/usr/bin/env bash
# Local CodeQL: pnpm install → database create → analyze (SARIF).
# Entry for: pnpm run codeql:local
# Requires: codeql on PATH, Node/pnpm per .node-version and package.json.
# Set CODEQL_PNPM_INSTALL_FLAGS="--frozen-lockfile" for CI-like installs.
#
# paths-ignore (coverage/, dist/, node_modules/, …) via render-code-scanning-config.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "${ROOT}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -n ${CODEQL_PNPM_INSTALL_FLAGS-} ]]; then
	# shellcheck disable=SC2086
	pnpm install ${CODEQL_PNPM_INSTALL_FLAGS}
else
	pnpm install
fi

CODEQL_CONFIG="$(mktemp)"
trap 'rm -f "${CODEQL_CONFIG}"' EXIT
"${SCRIPT_DIR}/render-code-scanning-config.sh" "${ROOT}" "${CODEQL_CONFIG}"

codeql database create .codeql_db \
	--language=javascript-typescript \
	--source-root . \
	--codescanning-config="${CODEQL_CONFIG}" \
	--overwrite

codeql database analyze .codeql_db \
	"codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls" \
	--format=sarif-latest \
	--output=codeql-results.sarif \
	--download

echo "Wrote codeql-results.sarif" >&2
