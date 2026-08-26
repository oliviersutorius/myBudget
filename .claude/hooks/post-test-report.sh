#!/usr/bin/env bash
# PostToolUse hook (Bash) — après une commande de test, affiche un résumé de couverture.

set -uo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ "$command" =~ npm\ test || "$command" =~ jest ]]; then
  if [[ -f coverage/coverage-summary.json ]]; then
    echo "📊 Résumé de couverture :" >&2
    jq -r '.total | "lines: \(.lines.pct)%  branches: \(.branches.pct)%  functions: \(.functions.pct)%  statements: \(.statements.pct)%"' coverage/coverage-summary.json >&2
  fi
fi

exit 0
