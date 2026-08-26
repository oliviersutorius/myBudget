#!/usr/bin/env bash
# PreToolUse hook (Bash) — bloque `git push` tant que la suite de tests complète
# (seuil de couverture 90%) ne passe pas.

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ "$command" =~ ^git\ push ]]; then
  echo "→ pre-push: suite de tests complète (seuil de couverture 90%)" >&2

  if ! npm test -- --coverage --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90,"statements":90}}'; then
    echo "❌ Tests en échec ou couverture insuffisante (< 90%). Push bloqué." >&2
    exit 2
  fi

  echo "✅ pre-push OK" >&2
fi

exit 0
