# Agents — myBudget

Projet solo dev, mobile-only (React Native/Expo), sans backend. Le catalogue ci-dessous s'appuie autant que possible sur les agents/skills globaux déjà disponibles dans l'environnement plutôt que de dupliquer des définitions.

## Chaîne d'escalade standard

```
Développeur (react-native-agent)
      │
      ▼
Reviewer N1 (/review, à la demande) ──── bug/sécurité détecté ────► retour Développeur
      │ ok
      ▼
Review N2 — humaine (toi, obligatoire, sans SLA strict)
      │ ok
      ▼
Merge (merge commit) → déploiement manuel (staging puis production, approbation requise)
```

Documentaliste et Testeur interviennent en continu (avant/pendant la PR), pas dans la chaîne de blocage du merge elle-même.

---

## Développeur

- **Agent** : `react-native-agent`
- **Rôle** : implémentation des features, écrans, composants, logique métier (budget, comptes, transactions, catégories).
- **Skills associés** : `building-native-ui`, `native-data-fetching`, `test-driven-development`.
- **Activation** : `/new-feature`, `/new-component`, ou toute tâche d'implémentation sur `mobile-app/` (ou équivalent une fois le projet scaffoldé).
- **Périmètre** : code applicatif RN/Expo, hooks, écrans, navigation, intégration Zustand/Drizzle. Ne merge jamais lui-même.

## Reviewer N1 (automatique)

- **Commande** : `/review` (skill `code-review`, niveau `high`)
- **Déclencheur** : **à la demande** (pas automatique sur commit ni à l'ouverture de PR).
- **Vérifie** : bugs/régressions, sécurité (secrets, injections SQL locales), performance (N+1, index manquants, re-renders, listes non virtualisées), conventions du projet, couverture de tests, documentation manquante.
- **Format de sortie** : commentaires inline sur la PR GitHub.
- **Pouvoir de blocage** : **oui** — tout problème bug/sécurité bloque explicitement le merge jusqu'à correction.

## Testeur

- **Agent** : `react-native-test-agent`
- **Rôle** : écriture et maintenance des tests unitaires/intégration (Jest + React Native Testing Library) et e2e (Maestro), maintien du seuil de couverture à 90%.
- **Skills associés** : `javascript-testing-patterns`, `test-driven-development`.
- **Activation** : en amont de chaque implémentation (TDD) et à chaque `/new-feature` / `/new-component`.

## Documentaliste

- **Agent projet** : `.claude/agents/documentaliste.md`
- **Rôle** : génère/maintient la doc technique (`docs/technique/`) et fonctionnelle (`docs/fonctionnel/`) après chaque PR.
- **Commande associée** : `/doc-update`
- **Activation** : après implémentation et tests, avant merge.
- **Périmètre** : documentation uniquement, jamais de code applicatif.

## DevOps

- **Agent** : `cicd-agent`
- **Rôle** : maintien des pipelines GitHub Actions (`ci.yml`, `deploy-staging.yml`, `deploy-production.yml`), configuration EAS Build/Submit, gestion des environnements protégés GitHub.
- **Activation** : évolution de la CI/CD, ajout de nouveaux checks, changement de stratégie de déploiement.

## Auditeur sécurité (léger)

- **Commande** : `/security-check` + skill `security-review`
- **Rôle** : audit des dépendances (`npm audit`), détection de secrets en clair, vérification qu'aucun fichier protégé n'a été touché, revue des permissions Android/iOS demandées par l'app.
- **Périmètre restreint** : pas de check OWASP Top 10 côté serveur (aucun backend sur ce projet).
- **Activation** : à la demande, et systématiquement en CI (`security-audit` job).

## Architecte / Lead Dev (fusionnés, à la demande)

- **Agent** : agent par défaut (`claude`), pas d'agent dédié créé pour ce projet solo.
- **Rôle** : décisions structurantes ponctuelles (state management, architecture des données locales, navigation) — sollicité explicitement par toi quand un choix d'architecture se présente.
- **Note** : le rôle de Lead Dev (garant des standards, revue finale) est fusionné avec ta propre Review N2, l'équipe étant limitée à un seul développeur.
