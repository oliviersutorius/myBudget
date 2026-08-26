#!/usr/bin/env bash
# PreToolUse hook (Bash) — bloque `git commit` tant que lint / format / typecheck ne passent pas.
# Nécessite: jq. Suppose l'existence des scripts npm "lint", "format:check", "typecheck"
# (à créer lors du scaffold du projet Expo).

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ "$command" =~ ^git\ commit ]]; then
  echo "→ pre-commit: lint + format + typecheck" >&2

  if ! npm run lint --silent; then
    echo "❌ ESLint a échoué. Corrige les erreurs avant de commit." >&2
    exit 2
  fi

  if ! npm run format:check --silent; then
    echo "❌ Prettier a détecté un formatage incorrect (npm run format pour corriger)." >&2
    exit 2
  fi

  if ! npm run typecheck --silent; then
    echo "❌ Erreurs TypeScript détectées." >&2
    exit 2
  fi

  echo "✅ pre-commit OK" >&2
fi

exit 0
