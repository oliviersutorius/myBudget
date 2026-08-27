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

## Contexte domaine

**Vision** : myBudget est une application mobile de gestion de budget mensuel, permettant à un particulier de se situer chaque mois sur ses frais fixes et sur sa capacité à dépenser ou investir son "argent de poche" (le **montant disponible**). Priorité produit : simplicité assumée, efficacité dès le lancement. Indicateur de succès : le respect du budget mensuel par l'utilisateur.

**Entités principales** (détail à affiner au fil des tickets — voir `docs/DOMAIN.md`) :

- **Compte (bancaire)** — un utilisateur peut avoir **plusieurs comptes**. Chaque compte porte son propre budget, géré de façon **totalement indépendante** (pas d'agrégation entre comptes, ni dans les calculs ni dans l'UI).
- **Revenu** — entrée d'argent sur un compte donné, sur le mois.
- **Dépense** — sortie d'argent sur un compte donné, catégorisée selon un type à deux dimensions (niveau 1 / niveau 2).
- **Budget mensuel** — cycle aligné sur le mois calendaire, **par compte**.
- **Montant disponible** — ce qu'il reste sur un compte une fois les dépenses couvertes par rapport aux revenus **de ce compte**.

**Règles critiques connues à ce stade** :

- Application **100% locale**, aucune intégration externe (pas de connexion bancaire, pas d'analytics, pas de sync cloud).
- **Un seul persona (utilisateur humain)**, mais il peut gérer **plusieurs comptes bancaires** — pas de multi-profils/multi-utilisateurs, pas de budget partagé entre personnes.
- **Les sommes ne sont jamais additionnées entre comptes** — chaque compte est géré et affiché distinctement dans l'UI.
- Le budget mensuel suit le **mois calendaire** (pas de cycle personnalisé), pour chaque compte.

**Glossaire condensé** (détail complet : `docs/GLOSSARY.md`) :

- **Compte** — compte bancaire de l'utilisateur ; unité d'isolation des budgets (jamais agrégés entre eux).
- **Montant disponible** — terme fonctionnel officiel à utiliser dans le code/UI (le terme familier "argent de poche" ne doit pas apparaître dans le code), calculé **par compte**.
- **Dépense** — catégorisée niveau 1 / niveau 2 (hiérarchie à définir progressivement), rattachée à un compte.
- **Budget mensuel** — mois calendaire, par compte.

**Hors scope actuel** : synchronisation bancaire automatique, export/import de données, agrégation/consolidation entre comptes, multilingue, traçabilité/historique des modifications.

Modèle de domaine détaillé, règles métier, workflows et epics : **à définir progressivement dans les tickets de développement** (voir `docs/DOMAIN.md` et `docs/EPICS.md`).

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
