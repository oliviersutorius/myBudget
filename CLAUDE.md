# CLAUDE.md — myBudget

## Vue d'ensemble

**myBudget** est une application mobile de gestion de budget personnel, disponible sur **Android** et **iOS** à partir d'une base de code unique.

- **Statut** : Greenfield — aucun code existant, projet à scaffolder à partir de ce harnais.
- **Repo** : Monorepo (une seule application mobile, pas de backend séparé).
- **Données** : stockage **100% local** sur l'appareil (pas de backend, pas de synchronisation cloud, aucune donnée personnelle transmise à un tiers → pas de contrainte RGPD).
- **Équipe** : 1 développeur (solo dev), appuyé par des agents Claude Code.

## Stack technique

| Domaine                     | Choix                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework                   | React Native + **Expo** (Expo Router)                                                              |
| Langage                     | TypeScript strict                                                                                  |
| Base de données locale      | SQLite via `expo-sqlite` + **Drizzle ORM** (typage fort, migrations versionnées, index explicites) |
| State management            | **Zustand** (état partagé entre écrans)                                                            |
| Tests unitaires/intégration | Jest + React Native Testing Library                                                                |
| Tests e2e                   | Maestro                                                                                            |
| Couverture minimale         | **90%** — un test cassé ou une couverture insuffisante **bloque le merge**                         |
| CI/CD                       | GitHub Actions                                                                                     |
| Distribution                | Apple App Store + Google Play Store (via EAS Build/Submit)                                         |

> Le scaffold initial (`npx create-expo-app`, config Drizzle, config Zustand, config Jest/Maestro) est la première étape technique à réaliser une fois ce harnais en place — ce `CLAUDE.md` et les scripts référencés ci-dessous anticipent cette structure.

## Commandes de développement clés

_Scripts npm attendus par les hooks et la CI (à créer lors du scaffold) :_

```bash
npm install                    # installer les dépendances
npm run start                  # lancer le serveur Expo
npm run lint                   # ESLint
npm run format:check           # Prettier (vérification)
npm run typecheck              # tsc --noEmit
npm test -- --coverage         # Jest, seuil de couverture 90%
npm run test:e2e               # Maestro
npm audit                      # audit sécurité des dépendances
eas build --profile preview     # build staging/preview (déclenché manuellement)
eas build --profile production  # build production (manuel, approbation requise)
```

## Catalogue des agents

Voir `docs/AGENTS.md` pour le détail complet (rôle, prompt, périmètre, chaîne d'escalade).

| Rôle                             | Agent / Skill utilisé                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Développeur                      | `react-native-agent` (skill `building-native-ui`, `native-data-fetching`)                   |
| Reviewer N1 (auto, à la demande) | commande `/review` (skill `code-review`)                                                    |
| Testeur                          | `react-native-test-agent` (skills `javascript-testing-patterns`, `test-driven-development`) |
| Documentaliste                   | agent projet `.claude/agents/documentaliste.md`                                             |
| DevOps                           | `cicd-agent`                                                                                |
| Auditeur sécurité (léger)        | commande `/security-check` + skill `security-review`                                        |
| Architecte / Lead Dev            | à la demande (agent par défaut) — rôle fusionné avec la revue finale (solo dev)             |
| State management                 | `zustand-agent` (dès qu'un état est partagé entre écrans)                                   |

## Workflow Git & règles de contribution

- **GitHub Flow** : `main` toujours déployable, une branche de feature isolée par tâche (`feat/...`, `fix/...`).
- **Commits** : **Conventional Commits** obligatoires (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`, `perf:`, `ci:`).
- **PR obligatoire** avant tout merge sur `main`.
- **Review N1** (agent, déclenchée à la demande via `/review`) : bugs, sécurité, perf, conventions, couverture de tests, doc manquante — **bloque le merge** si un problème de sévérité bug/sécurité est détecté ; commentaires postés en inline sur la PR.
- **Review N2** (toi) : validation finale humaine, obligatoire, sans SLA strict (solo dev).
- **Merge** : merge commit (pas de squash, pas de rebase).

Détail complet du workflow et des checklists : `docs/WORKFLOW.md`.

## Ce que Claude Code peut / ne peut pas faire

✅ Peut :

- Implémenter features, écrans, composants, migrations de schéma local (SQLite/Drizzle).
- Écrire et exécuter les tests (unitaires, intégration, e2e), lancer lint/typecheck/build.
- Générer et mettre à jour la documentation technique et fonctionnelle après chaque PR.
- Ouvrir des PR, poster des commentaires de review inline (MCP GitHub).
- Lancer un audit de dépendances (`npm audit`).

❌ Ne peut pas :

- Modifier `*.env`, `android/keystore/**`, `ios/certs/**` (interdiction stricte — voir `.claude/settings.json`).
- Merger une PR sans validation humaine (Review N2).
- Déployer en staging ou en production (déploiement manuel uniquement ; approbation humaine obligatoire en production via l'environnement GitHub protégé `production`).
