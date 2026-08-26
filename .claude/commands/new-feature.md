---
description: Scaffold une nouvelle feature myBudget (écran, état, schéma local, tests, doc)
argument-hint: <nom-de-la-feature>
---

Scaffold la feature **$ARGUMENTS** pour myBudget en suivant le skill `test-driven-development` (tests d'abord).

Étapes attendues :

1. Crée une branche `feat/$ARGUMENTS` si elle n'existe pas déjà (GitHub Flow).
2. Si la feature nécessite un état partagé entre écrans, ajoute un store Zustand dédié (`zustand-agent`).
3. Si la feature nécessite un nouveau schéma / une nouvelle table locale, génère la migration Drizzle correspondante avec les index pertinents (voir `/db-migrate`).
4. Écris d'abord les tests (Jest + React Native Testing Library) couvrant le comportement attendu, puis implémente l'écran/composant avec `react-native-agent` (skill `building-native-ui`) jusqu'à ce qu'ils passent.
5. Ajoute un scénario Maestro si la feature introduit un nouveau parcours utilisateur critique.
6. Vérifie que la couverture (`npm test -- --coverage`) est ≥ 90% sur les fichiers touchés.
7. Génère la doc technique + fonctionnelle associée (`/doc-update`).

Ne merge rien toi-même : ouvre une PR et laisse la chaîne Développeur → Reviewer N1 (`/review`) → Review N2 humaine se dérouler.
