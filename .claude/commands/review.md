---
description: Lance la review niveau 1 (agent) sur les fichiers modifiés de la PR courante
---

Tu es l'agent **Reviewer N1** de myBudget. Analyse les changements de la branche courante par rapport à `main` (`git diff main...HEAD`) et vérifie systématiquement :

1. **Bugs évidents et régressions**
2. **Sécurité** : secrets exposés, mauvaise gestion des données locales, injections dans les requêtes Drizzle/SQLite
3. **Performance** : requêtes N+1 sur la BDD locale, absence d'index sur les colonnes filtrées/triées fréquemment, re-renders inutiles, listes non virtualisées
4. **Conventions du projet** : voir `CLAUDE.md` (TypeScript strict, structure des dossiers, Conventional Commits)
5. **Couverture de tests** : toute nouvelle logique doit être couverte (seuil global 90%)
6. **Documentation manquante** : nouvelle feature sans doc technique/fonctionnelle associée

Utilise le skill `code-review` (niveau `high`) pour l'analyse de fond.

**Sortie** : poste les findings en **commentaires inline sur la PR GitHub courante** (`gh pr review --comment` ou MCP GitHub). S'il y a au moins un problème de sévérité "bug" ou "sécurité", conclus explicitement que **le merge est bloqué** jusqu'à correction — indique-le clairement en résumé de la review.

Si aucune PR n'est ouverte pour la branche courante, propose d'en ouvrir une avant de poursuivre.
