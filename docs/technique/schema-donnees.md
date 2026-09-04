# Schéma de données — myBudget

> Doc technique. Détail fonctionnel du modèle : [`DOMAIN.md`](../DOMAIN.md) §3.

Base SQLite locale (`expo-sqlite`), schéma défini et migré via Drizzle ORM (`src/db/schema.ts`).

## Tables

- **`comptes`** — `id`, `nom`, `banque`. Racine du domaine : rien n'est jamais agrégé entre deux lignes de cette table.
- **`types_depense_niveau2`** — `id`, `compte_id` (FK), `libelle`, `niveau1` (`'fixe' | 'variable'`, fixé une fois pour toutes à la création). Référentiel propre à chaque compte.
- **`types_depense_niveau3`** — `id`, `niveau2_id` (FK), `libelle`. Porte le montant (via historique).
- **`montants_depense_historique`** — `id`, `type_depense_niveau3_id` (FK), `mois_effet` (`'YYYY-MM'`), `montant` (centimes, nullable). Une ligne uniquement lors d'un changement de valeur — voir "Historisation" ci-dessous.
- **`revenus`** — `id`, `compte_id` (FK), `mois` (`'YYYY-MM'`), `libelle`, `montant` (centimes).

Pas de table `mois` dédiée : le mois est une donnée dérivée (chaîne `'YYYY-MM'`) portée directement par `revenus` et `montants_depense_historique`.

## Index

Toutes les clés étrangères sont indexées (`compte_id`, `niveau2_id`, `type_depense_niveau3_id`). `montants_depense_historique` a en plus un index unique `(type_depense_niveau3_id, mois_effet)` pour garantir au plus une entrée d'historique par mois d'effet. `revenus` a un index composite `(compte_id, mois)` pour la page de détail d'un mois.

## Application des migrations

Les migrations générées par `npm run db:generate` (`drizzle/`) sont appliquées au démarrage de l'app via `useMigrations` (`drizzle-orm/expo-sqlite/migrator`), branché dans `src/app/_layout.tsx` : le splash natif reste affiché tant que la migration n'est pas terminée, et un écran d'erreur minimal s'affiche en cas d'échec.

Deux prérequis de build pour que `drizzle/migrations.js` (qui importe les fichiers `.sql` de migration comme des chaînes) fonctionne avec Metro :

- `metro.config.js` : `resolver.sourceExts` étendu avec `sql`, pour que Metro considère ces fichiers comme des modules.
- `babel.config.js` : plugin `babel-plugin-inline-import` (`extensions: ['.sql']`) pour inliner le contenu du fichier `.sql` comme chaîne de caractères à l'import.

Vérifié via `npx expo export --platform android` (bundle Metro complet, migration incluse). **Non vérifié sur la cible web** : `expo-sqlite` y repose sur un worker + wasm (`wa-sqlite`) que Metro ne résout pas out-of-the-box — non bloquant, le web n'est pas une plateforme cible de myBudget (voir `CLAUDE.md`, uniquement Android/iOS).

## Contraintes d'intégrité

`PRAGMA foreign_keys = ON` est activé dans `src/db/client.ts` (non actif par défaut sous SQLite). Combiné à l'absence de `ON DELETE CASCADE` sur les FK, toute tentative de suppression d'une ligne référencée échoue — c'est le mécanisme qui porte l'invariant "suppression bloquée si historique existant" (voir `DOMAIN.md` §4).

## Historisation des montants (SCD par changement)

`montants_depense_historique` n'enregistre une ligne que lors d'un changement de montant, d'une disparition (`montant = null`) ou d'une réapparition — jamais une ligne par mois écoulé.

Résolution du montant applicable à un type niveau 3 pour un mois donné : `src/db/queries/resolve-montant-depense.ts` (logique pure, testée unitairement) — on retient la dernière entrée dont `mois_effet <= mois` demandé ; `montant = null` ou absence d'entrée applicable = dépense absente ce mois-là. Pour tout un compte (onglet Dépenses), `src/db/queries/get-montants-historique-compte.ts` charge en une seule requête (jointure sur les 3 tables) tout l'historique du compte, résolu ensuite par `resolve-montants-niveau3-compte.ts` (regroupement par type niveau 3 puis appel à `resolveMontantDepense` pour chacun) — voir `docs/technique/audit-47.md` §2 pour la mesure de performance de cette requête. Un wrapper équivalent pour un seul type niveau 3 (`get-montant-depense-niveau3.ts`) a existé mais n'avait plus d'appelant depuis l'introduction de cette requête batch ; retiré lors de l'audit #47.

**Point ouvert** : la sémantique exacte de la date d'effet lors d'une saisie en cours de mois (le changement s'applique-t-il dès le mois en cours ou seulement le suivant ?) est à trancher dans le ticket #17 avant l'implémentation de la saisie (#9). Le schéma lui-même est agnostique à ce choix : il stocke un `mois_effet`, quelle que soit la règle retenue pour le calculer.

## Montants monétaires

Stockés en `integer` (centimes), pour éviter les erreurs d'arrondi en virgule flottante. Les règles de validation à la saisie (signe, précision) restent à trancher dans le ticket #18.
