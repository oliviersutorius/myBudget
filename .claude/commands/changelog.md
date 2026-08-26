---
description: Met à jour le CHANGELOG.md à partir des Conventional Commits depuis la dernière entrée
---

Met à jour `CHANGELOG.md` (format Keep a Changelog) à partir des commits Conventional Commits depuis le dernier tag/entrée (`git log <dernier-tag>..HEAD --oneline`).

Regroupe par type : `feat` → Added, `fix` → Fixed, `chore`/`refactor`/`perf` → Changed, `BREAKING CHANGE` → Breaking. Ignore les commits `test:`, `docs:`, `ci:` sauf s'ils sont notables pour l'utilisateur final.
