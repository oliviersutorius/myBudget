# Schéma de données — myBudget

> Doc technique. Détail fonctionnel du modèle : [`DOMAIN.md`](../DOMAIN.md) §3.

Base SQLite locale (`expo-sqlite`), schéma défini et migré via Drizzle ORM (`src/db/schema.ts`).

## Tables

- **`comptes`** — `id`, `nom`, `banque`. Racine du domaine : rien n'est jamais agrégé entre deux lignes de cette table.
- **`types_depense_niveau2`** — `id`, `compte_id` (FK), `libelle`, `niveau1` (`'fixe' | 'variable'`, fixé une fois pour toutes à la création). Référentiel propre à chaque compte.
- **`types_depense_niveau3`** — `id`, `niveau2_id` (FK), `libelle`. Porte le montant (via historique).
- **`montants_depense_historique`** — `id`, `type_depense_niveau3_id` (FK), `mois_effet` (`'YYYY-MM'`), `montant` (centimes, nullable). Réservée aux types niveau 1 **fixe** : une ligne uniquement lors d'un changement de valeur — voir "Historisation" ci-dessous.
- **`montants_depense_variable`** — `id`, `type_depense_niveau3_id` (FK), `mois` (`'YYYY-MM'`), `montant` (centimes, **non nullable**). Réservée aux types niveau 1 **variable** (ticket #52) : une ligne par (type, mois) où l'utilisateur a effectivement saisi un montant — jamais de reconduction, jamais de ligne pour un mois non saisi. Voir "Montants variables (pas d'historisation)" ci-dessous.
- **`revenus`** — `id`, `compte_id` (FK), `mois` (`'YYYY-MM'`), `libelle`, `montant` (centimes).

Pas de table `mois` dédiée : le mois est une donnée dérivée (chaîne `'YYYY-MM'`) portée directement par `revenus` et `montants_depense_historique`.

## Index

Toutes les clés étrangères sont indexées (`compte_id`, `niveau2_id`, `type_depense_niveau3_id`). `montants_depense_historique` a en plus un index unique `(type_depense_niveau3_id, mois_effet)` pour garantir au plus une entrée d'historique par mois d'effet. `montants_depense_variable` a de même un index unique `(type_depense_niveau3_id, mois)`, qui sert aussi de clé de résolution directe (voir ci-dessous). `revenus` a un index composite `(compte_id, mois)` pour la page de détail d'un mois.

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

**Date d'effet d'un changement en cours de mois** (ticket #17, tranché) : le changement s'applique **dès le mois en cours**, jamais différé au mois suivant — `setMontantDepenseNiveau3` est toujours appelé avec `moisEffet` = mois calendaire courant, quel que soit le jour de saisie (`src/app/comptes/[id]/edit.tsx`). Le schéma lui-même est agnostique à cette règle : il stocke un `mois_effet` au grain mois (pas de date exacte), donc aucune granularité "jour" n'aurait de toute façon été possible sans le faire évoluer. **Concerne uniquement le fixe** (ticket #52) : la notion de date d'effet différée n'a pas de sens pour le variable, qui n'a pas de reconduction.

## Montants variables (pas d'historisation)

Contrairement au fixe, `montants_depense_variable` ne modélise aucune reconduction : chaque ligne correspond exactement à un mois où l'utilisateur a saisi un montant (`montant` non nullable). Résolution du montant applicable à un type niveau 3 pour un mois donné : lecture directe de la ligne `(type_depense_niveau3_id, mois)` — pas de recherche de "dernière valeur connue", contrairement à `resolveMontantDepense`. Absence de ligne = dépense non saisie ce mois-là (traité à l'affichage de la même façon qu'une dépense fixe résolue à `null`, voir `MontantsParType3` dans `comptes/[id]/edit.tsx`).

Pour tout un compte à un mois donné (pavé Variable de l'onglet Dépenses), `src/db/queries/get-montants-variable-compte.ts` filtre directement en SQL sur ce mois (pas besoin de charger tout l'historique du compte comme pour le fixe), puis `agregerMontantsNiveau3Compte` (`resolve-montants-niveau3-compte.ts`) agrège par type niveau 2 parent — fonction également utilisée en interne par `resolveMontantsNiveau3Compte` (fixe) une fois l'historique résolu, pour ne pas dupliquer la logique de sommation.

Le mois affiché/saisi pour le variable se sélectionne indépendamment du fixe (toujours au mois courant) via un sélecteur de mois dédié (composant `MoisSelector`, extrait du sélecteur déjà utilisé par l'onglet Revenus) positionné entre les pavés Fixe et Variable de l'onglet Dépenses.

## Montants monétaires

Stockés en `integer` (centimes), pour éviter les erreurs d'arrondi en virgule flottante. Les règles de validation à la saisie (signe, précision) restent à trancher dans le ticket #18.
