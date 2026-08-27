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

**Contexte domaine** :

- **Entités manipulées** : Compte (un utilisateur peut en avoir plusieurs), Revenu, Dépense (catégorisation niveau 1 / niveau 2), Budget mensuel (mois calendaire, par compte), Montant disponible (par compte).
- **Règles métier à respecter** : application 100% locale (aucun appel réseau/tiers) ; un seul persona utilisateur mais multi-comptes bancaires possibles ; **les comptes ne sont jamais agrégés** (calculs et UI distincts par compte) ; le budget mensuel suit toujours le mois calendaire.
- **Vocabulaire à utiliser** : "montant disponible" (jamais "argent de poche", terme familier réservé aux échanges produit) — voir `docs/GLOSSARY.md`.
- **Intégrations externes** : aucune — vigilance si une tâche semble impliquer un service tiers, service à re-questionner avant implémentation.

## Reviewer N1 (automatique)

- **Commande** : `/review` (skill `code-review`, niveau `high`)
- **Déclencheur** : **à la demande** (pas automatique sur commit ni à l'ouverture de PR).
- **Vérifie** : bugs/régressions, sécurité (secrets, injections SQL locales), performance (N+1, index manquants, re-renders, listes non virtualisées), conventions du projet, couverture de tests, documentation manquante.
- **Format de sortie** : commentaires inline sur la PR GitHub.
- **Pouvoir de blocage** : **oui** — tout problème bug/sécurité bloque explicitement le merge jusqu'à correction.

**Contexte domaine** :

- **Entités à connaître** : Compte (multi-comptes possibles), Revenu, Dépense (niveau 1 / niveau 2), Budget mensuel, Montant disponible.
- **Règles métier à vérifier** : aucune intégration externe introduite (100% local) ; vocabulaire correct dans le code/UI ("montant disponible", pas "argent de poche") ; cohérence avec le cycle mensuel calendaire ; **aucune agrégation entre comptes** (un bug fréquent à surveiller : sommer des montants de plusieurs comptes).
- **Vigilance particulière** : toute dépendance réseau, service tiers ou stockage non local doit être signalée comme écart vis-à-vis de la contrainte 100% local.

## Testeur

- **Agent** : `react-native-test-agent`
- **Rôle** : écriture et maintenance des tests unitaires/intégration (Jest + React Native Testing Library) et e2e (Maestro), maintien du seuil de couverture à 90%.
- **Skills associés** : `javascript-testing-patterns`, `test-driven-development`.
- **Activation** : en amont de chaque implémentation (TDD) et à chaque `/new-feature` / `/new-component`.

**Contexte domaine** :

- **Entités à couvrir dans les tests** : Compte (multi-comptes), Revenu, Dépense (niveau 1 / niveau 2), Budget mensuel, Montant disponible — en particulier le calcul du montant disponible par compte et son affichage instantané.
- **Règles métier à tester** : comportement 100% offline (aucun appel réseau à mocker/attendre) ; cycle mensuel calendaire ; persona unique multi-comptes ; **non-agrégation entre comptes** (cas de test explicite : plusieurs comptes avec des montants qui ne doivent jamais se sommer).
- **Vocabulaire** : utiliser "montant disponible" dans les noms de tests et assertions.

## Documentaliste

- **Agent projet** : `.claude/agents/documentaliste.md`
- **Rôle** : génère/maintient la doc technique (`docs/technique/`) et fonctionnelle (`docs/fonctionnel/`) après chaque PR.
- **Commande associée** : `/doc-update`
- **Activation** : après implémentation et tests, avant merge.
- **Périmètre** : documentation uniquement, jamais de code applicatif.

**Contexte domaine** :

- **Entités à documenter** : Compte (multi-comptes), Revenu, Dépense (niveau 1 / niveau 2), Budget mensuel, Montant disponible — maintenir `docs/DOMAIN.md`, `docs/GLOSSARY.md` et `docs/EPICS.md` à jour à mesure que le modèle de domaine se précise dans les tickets.
- **Vocabulaire à respecter** : "montant disponible" (jamais "argent de poche" dans la doc technique/fonctionnelle finale).
- **Contraintes à rappeler dans la doc** : 100% local, aucune intégration externe, persona unique.

## DevOps

- **Agent** : `cicd-agent`
- **Rôle** : maintien des pipelines GitHub Actions (`ci.yml`, `deploy-staging.yml`, `deploy-production.yml`), configuration EAS Build/Submit, gestion des environnements protégés GitHub.
- **Activation** : évolution de la CI/CD, ajout de nouveaux checks, changement de stratégie de déploiement.

## Auditeur sécurité (léger)

- **Commande** : `/security-check` + skill `security-review`
- **Rôle** : audit des dépendances (`npm audit`), détection de secrets en clair, vérification qu'aucun fichier protégé n'a été touché, revue des permissions Android/iOS demandées par l'app.
- **Périmètre restreint** : pas de check OWASP Top 10 côté serveur (aucun backend sur ce projet).
- **Activation** : à la demande, et systématiquement en CI (`security-audit` job).

**Contexte domaine** :

- **Règle métier critique à faire respecter** : aucune intégration externe ne doit être introduite (l'app est 100% locale, sans backend ni sync cloud) — toute dépendance ajoutée qui ferait transiter des données financières de l'utilisateur vers un tiers doit être bloquée et remontée.
- **Entités sensibles** : Compte, Revenu, Dépense, Montant disponible — données financières personnelles à garder strictement locales même sans contrainte RGPD formelle (pas de tiers concerné).

## Architecte / Lead Dev (fusionnés, à la demande)

- **Agent** : agent par défaut (`claude`), pas d'agent dédié créé pour ce projet solo.
- **Rôle** : décisions structurantes ponctuelles (state management, architecture des données locales, navigation) — sollicité explicitement par toi quand un choix d'architecture se présente.
- **Note** : le rôle de Lead Dev (garant des standards, revue finale) est fusionné avec ta propre Review N2, l'équipe étant limitée à un seul développeur.

**Contexte domaine** :

- **Entités structurantes** : Compte (multi-comptes, agrégat racine du budget), Revenu, Dépense (niveau 1 / niveau 2), Budget mensuel (mois calendaire), Montant disponible — voir `docs/DOMAIN.md` pour le détail progressif.
- **Règles métier à arbitrer** : garder l'app 100% locale et sans intégration externe ; garder le produit simple (pas de sur-fonctionnalité) ; persona unique mais multi-comptes ; **jamais d'agrégation entre comptes**, ce qui structure fortement le modèle de données (isolation par compte) et la navigation UI.
- **Vocabulaire** : "montant disponible" comme terme officiel.
- **Intégrations externes** : aucune à ce jour — toute proposition d'intégration doit être validée explicitement, elle sort du cadre défini dans `docs/DOMAIN.md`.
