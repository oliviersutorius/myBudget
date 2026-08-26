---
description: Génère/met à jour la documentation technique et fonctionnelle après une PR
---

Déclenché après chaque PR (manuellement, ou via l'agent Documentaliste `.claude/agents/documentaliste.md`).

1. Analyse le diff de la PR courante (`git diff main...HEAD`).
2. Met à jour la **doc technique** (`docs/technique/`) : nouveaux modules, schéma de données, architecture, décisions notables.
3. Met à jour la **doc fonctionnelle** (`docs/fonctionnel/`) : nouveaux parcours utilisateurs, écrans, règles de gestion du budget.
4. Ne documente que ce qui a changé — ne réécris pas l'existant sans raison.
5. Signale dans le résumé toute feature significative qui n'a pas de doc associée.
