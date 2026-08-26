---
description: Génère un nouveau composant UI réutilisable React Native pour myBudget
argument-hint: <NomDuComposant>
---

Crée le composant **$ARGUMENTS** dans le dossier des composants partagés, en suivant le skill `building-native-ui` et les conventions du projet (`CLAUDE.md`).

1. Écris d'abord le test du composant (Jest + React Native Testing Library) : rendu, props, interactions.
2. Implémente le composant en TypeScript strict, typé (props explicites), sans logique métier (composant "dumb" — la logique reste dans les hooks/stores appelants).
3. Vérifie l'accessibilité de base (labels, rôles) même si aucun test visuel n'est requis sur ce projet.
4. Lance `npm run lint`, `npm run typecheck`, `npm test -- --coverage` sur les fichiers touchés.

Pas de test de snapshot visuel (non requis sur myBudget).
