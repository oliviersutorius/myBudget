# Domaine — myBudget

> Document de référence fonctionnelle. Complété progressivement — certaines sections seront affinées au fil des tickets de développement (voir mentions "à définir").

## 1. Vision & objectifs

**myBudget** est une application mobile de gestion de budget mensuel, permettant à un particulier de se situer chaque mois sur ses frais fixes et sur sa capacité à dépenser ou investir son "argent de poche".

- **Problème résolu** : savoir où l'on en est chaque mois par rapport à son budget — frais fixes engagés vs. montant réellement disponible.
- **Différenciation** : simplicité assumée. Pas de surcharge fonctionnelle façon app bancaire complète ou tableur — l'app reste volontairement légère.
- **Indicateur de succès principal** : le respect du budget mensuel par l'utilisateur.
- **MVP vs. vision long terme** : le cœur de l'app doit être simple et efficace dès le lancement (day one). De nouvelles fonctionnalités pourront être ajoutées à court terme, mais sans complexifier l'esprit "simple" du produit.
- **Contraintes de calendrier** : aucune deadline fixée, mais exigence de qualité et d'efficacité dès la sortie.

## 2. Utilisateurs

Un seul persona :

- **Particulier solo** — personne qui souhaite gérer ses dépenses fixes mensuelles par rapport à ses revenus, pour connaître son montant disponible ("argent de poche") chaque mois, **sur chacun de ses comptes bancaires**.

Un même utilisateur peut posséder **plusieurs comptes bancaires** ; il n'y a toujours qu'un seul utilisateur humain (pas de multi-profils, pas de budget partagé entre personnes).

Pas d'utilisateurs non-humains (pas d'import automatique, pas de webhook, pas de système tiers). Pas d'exigence d'accessibilité particulière. Application non multilingue (français). Localisation : devise €, format de date français, réglementation française.

## 3. Modèle de domaine

### 3.1 Compte

Un **compte bancaire** de l'utilisateur. Racine/agrégat du domaine : tout (types de dépenses, mois, revenus, dépenses) est rattaché à un compte, et rien n'est jamais agrégé entre comptes.

- **Attributs** : nom, banque.
- Un utilisateur peut avoir **plusieurs comptes**.
- **Invariant critique** : les comptes sont gérés **distinctement et jamais agrégés** — pas de somme consolidée entre comptes, ni dans les calculs ni dans l'UI.

### 3.2 Type de dépense (hiérarchie à 3 niveaux, spécifique à un compte)

Chaque compte définit **son propre référentiel** de types de dépenses (pas de référentiel partagé entre comptes). Hiérarchie à 3 niveaux :

- **Niveau 1** — toujours `fixe` ou `variable`. Ce n'est pas créé directement par l'utilisateur : sa valeur est **fixée au moment de la création d'un type de niveau 2**, et s'applique à tous les niveaux 3 qui en dépendent.
- **Niveau 2** — une catégorie de dépense (ex : "Maison", "Placement financier"), rattachée à un compte et à un niveau 1 (fixe/variable).
- **Niveau 3** — une ligne concrète de dépense (ex : "Crédit immobilier", "Assurance habitation" sous "Maison" ; "PER Olivier", "PER Carène", "Livret A Olivier", "Livret A Carène" sous "Placement financier"), rattachée à un niveau 2. C'est le niveau 3 qui porte le **montant**.

Exemple illustratif fourni :

```
Maison (niveau 2, ex. fixe)
  ├─ Crédit immobilier (niveau 3)
  └─ Assurance habitation (niveau 3)
Placement financier (niveau 2)
  ├─ PER Olivier (niveau 3)
  ├─ PER Carène (niveau 3)
  ├─ Livret A Olivier (niveau 3)
  └─ Livret A Carène (niveau 3)
```

Cette hiérarchie (niveaux 2 et 3) est **éditable sur la page d'édition du compte bancaire**.

### 3.3 Montant d'un type de dépense (niveau 3) — historisation

Chaque type de dépense de niveau 3 a un **montant défini par l'utilisateur**, qui :

- est **reconduit automatiquement chaque mois** par défaut,
- peut **évoluer dans le temps**, ou **disparaître/réapparaître** d'un mois à l'autre.

**Contrainte technique explicite** : il ne faut **pas dupliquer l'information en base à chaque mois** si le montant ne change pas. Le stockage doit utiliser un système d'**historisation par changement** (type SCD / "effective dating") : on n'enregistre une nouvelle ligne que lorsqu'un montant change (ou disparaît/réapparaît), et le montant applicable à un mois donné se résout en cherchant la dernière valeur connue à cette date. Le détail du schéma (table de valeurs avec date d'effet, gestion de la "disparition" d'une dépense un mois donné) reste à concevoir lors du ticket technique dédié.

### 3.4 Revenu

Entrée d'argent, rattachée à un **compte** et à un **mois** donné. Saisie par l'utilisateur via un bouton "+" sur la page de détail du mois.

### 3.5 Mois / Budget mensuel

- Correspond au **mois calendaire**, par compte.
- Sur la page récapitulative d'un compte : une ligne par mois, **triées par ordre chronologique décroissant**, avec un résumé des dépenses et des revenus du mois.
- Au clic sur une ligne mois : vue détaillée avec répartition par niveau (1/2/3) des dépenses, et liste des revenus du mois (+ bouton "+" pour en ajouter).

### 3.6 Montant disponible

Ce qu'il reste sur un compte, pour un mois donné, une fois les dépenses couvertes par rapport aux revenus de ce même compte (voir [Glossaire](GLOSSARY.md)).

### 3.7 Écrans identifiés à ce stade

- **Page d'accueil** : résumé des comptes existants (bouton d'édition par compte) ; message d'incitation si aucun compte configuré ; bouton "+" pour ajouter un compte (toujours visible).
- **Page d'édition d'un compte** : nom, banque, gestion des types de dépenses (niveaux 2/3) spécifiques à ce compte.
- **Page récapitulative d'un compte** : liste des mois (desc.), résumé dépenses/revenus par ligne.
- **Page de détail d'un mois** : répartition des dépenses par niveau, liste des revenus, ajout de revenu.

Entités détaillées (attributs complets, contraintes de validation, schéma Drizzle exact) : à finaliser lors des tickets techniques correspondants.

## 4. Règles métier et processus

### Processus principaux

- **Création d'un compte** : depuis le bouton "+" (page d'accueil), saisie nom + banque.
- **Édition d'un compte** : modification nom/banque, gestion du référentiel de types de dépenses (niveaux 2/3, propre à ce compte).
- **Saisie/évolution du montant d'une dépense (niveau 3)** : l'utilisateur définit ou met à jour un montant ; le système historise le changement sans dupliquer les mois où le montant n'a pas bougé (voir 3.3).
- **Saisie d'un revenu** : depuis la page de détail d'un mois, bouton "+".
- **Consultation du récapitulatif mensuel** : liste des mois d'un compte (desc.) → détail d'un mois (dépenses par niveau + revenus).
- **Rappel mensuel** : notification locale le 1er de chaque mois pour inciter à saisir les revenus du mois.

### Invariants métier critiques

- **Les budgets et montants ne sont jamais additionnés entre comptes.** Chaque compte bancaire a son propre budget mensuel, son propre calcul de montant disponible, et sa propre vue dans l'UI — de façon totalement indépendante des autres comptes de l'utilisateur.
- **Les types de dépenses (niveaux 1/2/3) sont propres à un compte** — pas de référentiel partagé entre comptes.
- **Le niveau 1 (fixe/variable) est toujours dérivé** : il est fixé à la création d'un type niveau 2, jamais saisi indépendamment.
- **Pas de duplication de montant en base pour les mois sans changement** — historisation par changement obligatoire pour les montants de type de dépense (niveau 3).
- **Suppression bloquée si historique existant** : un compte, ou un type de dépense (niveau 2/3), ne peut pas être supprimé s'il a déjà de l'historique associé (dépenses/revenus saisis sur un mois passé). Évite toute perte de données ; un mécanisme d'archivage pourra être introduit ultérieurement si le besoin se confirme.

## 5. Intégrations externes

**Aucune intégration externe.** Confirmé : application 100% locale, sans backend, sans synchronisation cloud, sans service tiers (pas de connexion bancaire, pas d'analytics, pas de notification push via service tiers).

- **Notifications locales** : rappels de saisie programmés sur l'appareil (pas de service externe).
- **Export / import de données** : non prévu.

## 6. Contraintes fonctionnelles & qualité

- **Performance perçue** : l'application doit être très fluide, avec un accès quasi instantané au budget du mois.
- **Offline** : l'application fonctionne intégralement hors connexion (cohérent avec le stockage 100% local).
- **Rétention / archivage** : purge de l'historique au bout de X années — la valeur de X reste **à définir**.
- **Traçabilité / audit** : pas de besoin de traçabilité ou d'historique des modifications (ex : pas de suivi des changements sur une dépense).

## 7. Glossaire condensé

Voir [`GLOSSARY.md`](GLOSSARY.md) pour le détail.
