# Audit technique #47 — sécurité, performance BDD, dette de code

> Doc technique. Ticket source : [#47](https://github.com/oliviersutorius/myBudget/issues/47). Trois volets indépendants, exécutés le 2026-09-04 sur `main` (`7ca073c`).

## 1. Audit de sécurité

### 1.1 `npm audit`

`npm audit` n'a pas pu être exécuté directement dans cet environnement (l'endpoint d'audit rapide de npmjs.org retourne une erreur 400 avec la version de npm disponible ici — `10.8.2`). Le job CI **`Audit sécurité des dépendances`** (`npm audit --audit-level=high`) tourne sur chaque PR et est **au vert** sur le dernier run de `main` ([run 33762500355](../../.github/workflows/ci.yml)) : aucune vulnérabilité `high`/`critical`.

Détail du dernier rapport (4 vulnérabilités **modérées**, toutes transitives) :

| Paquet vulnérable            | Chemin de dépendance                                                                                                           | Advisory                                                                                                                                | Nature                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `decode-uri-component@0.2.2` | `expo-router` → `query-string@7.1.3` → `decode-uri-component`                                                                  | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) — ReDoS sur decodage d'URL malformée                           | Dans l'arbre runtime (routing), surface d'attaque = deep links                            |
| `esbuild@0.18.20`            | `drizzle-kit` → `@esbuild-kit/core-utils` → `esbuild` (deux autres copies résolues, `0.25.12`/`0.28.2`, ne sont pas affectées) | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) — serveur de dev esbuild accessible depuis n'importe quel site | Outillage de build local uniquement (`drizzle-kit generate`, pas de serveur de dev lancé) |
| `uuid@7.0.3`                 | `expo-splash-screen` → `@expo/config-plugins` → `xcode` → `uuid`                                                               | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — bounds check manquant si `buf` fourni                        | Outillage `expo prebuild` (génération projet Xcode), pas de code applicatif               |

**Aucune n'est bloquante** (toutes modérées, le seuil CI est `high`). Point d'attention : le correctif suggéré par `npm audit fix --force` **downgrade** `expo-router` (→ 5.1.11) et `drizzle-kit` (→ 0.18.1) et `expo-splash-screen` (→ 55.0.25), ce qui casserait l'alignement sur Expo SDK 57 — **ne pas appliquer `--force`**. Recommandation : suivre les futures releases d'`expo-router`/`drizzle-kit`/`@expo/config-plugins` et mettre à jour normalement quand elles embarquent des versions corrigées. Un ticket de suivi dédié est ouvert pour ça (voir section Suivi).

### 1.2 Secrets et fichiers protégés

- Aucun secret en clair dans le code versionné (recherche de patterns `api[_-]?key|secret|token|password|bearer|authorization` sur `src/` — seuls des faux positifs liés au terme "token" au sens design system).
- Aucun fichier `.env` réel versionné (seul `.env.example`, sans valeur). Aucune modification de `*.env`, `android/keystore/**` ou `ios/certs/**`.

### 1.3 Patterns sensibles côté code

- Toutes les requêtes (`src/db/queries/`) passent par le query builder Drizzle (paramétrage automatique) — aucune concaténation de chaîne SQL, aucun `sql.raw`/template `sql\`...\``avec variable interpolée (les seuls usages de`sql\`...\``sont des littéraux`(current_timestamp)`dans`schema.ts`). **Pas de risque d'injection SQL identifié.**
- Stockage local non chiffré (SQLite standard, pas de SQLCipher). Vu le contexte (100% local, pas de sync, pas de tiers, sandboxing OS natif sur Android/iOS qui isole déjà les données d'une app à l'autre), ce n'est pas retenu comme un manque bloquant — mais si le produit devait un jour stocker des données plus sensibles, `expo-sqlite` ne propose pas nativement le chiffrement (nécessiterait une lib tierce type SQLCipher).
- Permissions Android/iOS : aucune permission explicite déclarée dans `app.json` (pas de caméra, localisation, contacts, etc.) — conforme au principe du moindre privilège, cohérent avec une app 100% locale sans intégration externe.

### 1.4 `expo-doctor` (hygiène des dépendances)

20/21 checks passent. Le check qui échoue liste 13 paquets dont la version installée dévie légèrement (patch) de celle attendue par le SDK Expo 57 (`expo`, `expo-router`, `expo-sqlite`, `react-native`, etc.), plus `@types/jest` en écart de version majeure (paquet de types, dev-only). Rien de critique, mais `npx expo install --check` remettrait tout à l'aplomb — recommandé en maintenance courante plutôt que dans ce ticket (risque de régression à tester si fait en dehors d'une PR dédiée).

**Conclusion volet 1** : pas de vulnérabilité bloquante, pas d'injection SQL, pas de secret exposé, permissions minimales. 4 vulnérabilités modérées transitives à suivre (ticket dédié), pas de correctif à appliquer immédiatement.

## 2. Performance des requêtes BDD

### Méthodologie

Pas de harnais de benchmark existant dans le repo (les fichiers `src/db/queries/*.ts` sont des builders de requêtes non exécutés, testés uniquement sur leur logique de résolution pure — voir `schema-donnees.md`). `expo-sqlite` nécessite un runtime natif, donc pour mesurer des temps d'exécution réels, le script d'audit (`better-sqlite3`, hors repo, jetable) a rejoué le schéma exact de `drizzle/0000_dashing_alice.sql` (même moteur SQLite) avec un jeu de données synthétique représentatif : plusieurs comptes, plusieurs années d'historique.

Deux scénarios :

- **Réaliste** : 10 comptes, 8 types niveau 2 / compte, 6 types niveau 3 / type 2 (480 types 3 au total), 10 ans d'historique, changement de montant tous les ~4 mois en moyenne → **14 400 lignes d'historique**, 3 600 revenus.
- **Pessimiste** : 10 comptes, 800 types niveau 3, 15 ans, changement **tous les mois** (borne haute très improbable vu le modèle métier — l'historisation n'enregistre que les changements) → **144 000 lignes d'historique**.

### Résultats (temps moyen, warm-up exclu)

| Requête                                                         | Réaliste (14,4k lignes hist.) | Pessimiste (144k lignes hist.) |
| --------------------------------------------------------------- | ----------------------------- | ------------------------------ |
| `getComptesQuery`                                               | 0,007 ms                      | 0,007 ms                       |
| `getRevenusQuery` (revenus/mois d'un compte)                    | 0,004 ms                      | 0,004 ms                       |
| `getTypesDepenseNiveau2Query`                                   | 0,008 ms                      | 0,009 ms                       |
| `getTypesDepenseNiveau3Query`                                   | 0,005 ms                      | 0,006 ms                       |
| **`getMontantsHistoriqueCompteQuery`** (batch, onglet Dépenses) | **1,08 ms**                   | **12,3 ms**                    |

`EXPLAIN QUERY PLAN` sur la requête batch confirme l'usage des index sur les trois scénarios (`SEARCH ... USING INDEX`, aucun `SCAN` de table) :

```
SEARCH t2 USING COVERING INDEX types_depense_niveau2_compte_id_idx (compte_id=?)
SEARCH t3 USING COVERING INDEX types_depense_niveau3_niveau2_id_idx (niveau2_id=?)
SEARCH h USING INDEX montants_depense_historique_type_id_idx (type_depense_niveau3_id=?)
```

### Index et absence de N+1

Le schéma (`src/db/schema.ts`) couvre déjà tous les filtres réellement utilisés par les requêtes : `types_depense_niveau2(compte_id)`, `types_depense_niveau3(niveau2_id)`, `montants_depense_historique(type_depense_niveau3_id)` + unique `(type_depense_niveau3_id, mois_effet)`, `revenus(compte_id, mois)`. Rien à ajouter.

L'onglet Dépenses (le seul écran qui affiche potentiellement des dizaines de lignes niveau 3) est déjà construit pour éviter le N+1 : **une seule requête** (`getMontantsHistoriqueCompteQuery`, jointure sur 3 tables) charge tout l'historique du compte, résolu ensuite côté JS mois par mois (`resolveMontantsNiveau3Compte`) — voir le commentaire explicite dans le code qui documente ce choix. Pour comparer, le script a aussi mesuré le pattern "1 requête par type niveau 3" équivalent à ce qu'aurait donné `getMontantDepenseNiveau3` appelé en boucle (voir §3) : le temps d'exécution SQL brut est proche de la requête batch dans ce benchmark in-process, **mais ce nombre ne capture pas le coût réel en production** — chaque requête `expo-sqlite` traverse le pont JS↔natif de React Native (coût fixe non négligeable par appel), invisible ici puisque `better-sqlite3` tourne in-process. Le gain réel de la requête batch (moins d'aller-retours JS↔natif) est donc plus important en conditions réelles que ne le montre ce chiffre brut — l'architecture actuelle reste le bon choix.

**Conclusion volet 2** : aucune requête problématique, aucun index manquant, aucun N+1 dans le code actuellement utilisé par l'app. Même dans le scénario pessimiste (144k lignes, borne largement au-dessus de tout usage réaliste pour un utilisateur unique), la requête la plus lourde reste sous 15 ms. Pas d'optimisation nécessaire à ce stade.

## 3. Code mort et dépendances inutilisées

Outillage : `ts-prune` (exports inutilisés) + `depcheck` (dépendances npm inutilisées), croisés avec une revue manuelle (les deux outils produisent des faux positifs sur ce projet : fichiers `.web.tsx` résolus par plateforme, pages Expo Router qui doivent exporter un `default`, types utilisés uniquement dans leur propre fichier).

### 3.1 Export confirmé inutilisé

- **`src/db/queries/get-montant-depense-niveau3.ts`** (`getMontantDepenseNiveau3`) — zéro appelant dans `src/` (confirmé par `ts-prune`, par recherche manuelle, et il est explicitement exclu de la couverture dans `jest.config.js` en tant que "wiring Drizzle mince"). Il résout le montant d'**un seul** type niveau 3, alors que l'écran `comptes/[id]/edit.tsx` utilise exclusivement la variante batch (`getMontantsHistoriqueCompteQuery` + `resolveMontantsNiveau3Compte`, voir §2) depuis son introduction. Le fichier semble avoir été la première implémentation, remplacée par l'approche batch sans être retirée. `resolveMontantDepense` (la fonction de résolution pure qu'il appelle) reste utilisée ailleurs (par `resolveMontantsNiveau3Compte`) — seul le wrapper Drizzle est mort.

### 3.2 Dépendances npm inutilisées (`depcheck`)

Zéro référence dans `src/`, `app.json` (pas de plugin), ni aucun fichier de config :

- `@expo/ui`
- `expo-device`
- `expo-glass-effect`
- `expo-status-bar`
- `expo-system-ui`

### 3.3 Cas à trancher (au-delà du "code mort" au sens strict)

Deux éléments ne sont pas du code mort au sens de "jamais atteint", mais posent la question de leur place dans le produit :

- **`src/app/(tabs)/explore.tsx`** — reste l'écran de démo par défaut du scaffold Expo Router ("File-based routing", "Images", "Light and dark mode components", "Animations"), branché et visible dans la barre d'onglets (`app-tabs.tsx`, onglet "Explore") sur une app dont le domaine réel est budget/comptes/dépenses. Aucun contenu lié au métier myBudget.
- **`src/store/use-settings-store.ts`** — commenté dans le code même comme "Exemple de store Zustand partagé entre écrans... voir `/new-feature`" : c'est un gabarit d'exemple (devise EUR/USD/GBP, hors scope produit — pas de multi-devise dans `DOMAIN.md`/`GLOSSARY.md`), pas une feature. Testé unitairement mais jamais consommé par un écran.
- **`src/store/use-compte-actif-store.ts`** — celui-ci n'est pas un exemple (implémenté sur un ticket dédié, #2), mais n'est actuellement câblé dans aucun écran (`comptes/[id]/edit.tsx` reçoit son `compteId` par les paramètres de route, pas par ce store). Possiblement une brique posée en avance pour une feature à venir (compte actif persistant entre écrans) — à confirmer plutôt qu'à supprimer par défaut.

**Conclusion volet 3** : un export mort confirmé (§3.1) et cinq dépendances npm inutilisées (§3.2) — retrait à faible risque sous réserve de validation. Trois éléments plus structurants (§3.3) nécessitent une décision produit plutôt qu'un simple nettoyage.

## Suivi

- Ticket dédié ouvert pour le suivi des 4 vulnérabilités modérées transitives (§1.1).
- Liste de code mort/dépendances ci-dessus soumise au développeur avant toute suppression (voir critères d'acceptance #47).
