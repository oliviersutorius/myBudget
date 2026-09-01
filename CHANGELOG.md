# Changelog

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Généré/maintenu via la commande `/changelog` à partir des Conventional Commits.

## [Unreleased]

### Added

- Schéma de données local (SQLite/Drizzle) : comptes, types de dépenses à 3 niveaux, historisation des montants par changement (sans duplication mensuelle), revenus.
- Store Zustand du compte actif, partagé entre écrans sans transiter par les paramètres de route.
- Page d'accueil : liste des comptes bancaires (nom + banque), rafraîchie automatiquement à chaque création/modification.
- État vide de la liste des comptes avec message d'incitation, et bouton d'ajout toujours visible.
- Formulaire de création d'un compte bancaire.
- Formulaire d'édition d'un compte.
- Gestion des types de dépenses niveau 2 (Fixe/Variable) sur la page compte.
- Gestion des types de dépenses niveau 3 sous un type niveau 2.
- Page compte réorganisée en 4 onglets : Infos, Dépenses, Revenus, Budget (Revenus et Budget en coquilles fonctionnelles, en attendant les tickets #9/#12/#13).
- Onglet Revenus : ajout d'un revenu sur un mois donné, navigation mois par mois, modification et suppression d'un revenu (#12).
- Types de dépenses niveau 3 : saisie et historisation du montant par mois, avec action « Marquer absente » pour un mois sans dépense (#9).

### Fixed

- Migrations Drizzle réellement appliquées au démarrage (la base démarrait auparavant sans aucune table).
- Splash natif désormais masqué même en cas d'échec de migration.
- Tab bar native qui masquait les dernières lignes (et le bouton "Modifier") de la liste des comptes.
- Rendu web statique erroné au démarrage du serveur Expo, qui échouait systématiquement et polluait les logs.
- Échec de création d'un compte désormais géré avec un message d'erreur.
- Routes hors-onglets (création et édition de compte) rendues navigables depuis les boutons "+"/"Modifier".
- Rafraîchissement live de la base de données activé (les listes restaient figées après une écriture faite depuis un autre écran).
- Échec de chargement d'un compte à éditer désormais géré.
- Message d'erreur distinct lors d'une suppression bloquée par une contrainte de clé étrangère ; accessibilité renforcée des sélecteurs et actions.
- Le passage en édition d'un type niveau 2 ne fait plus perdre une ligne niveau 3 en cours d'ajout ou d'édition.
- Le type niveau 2 parent sélectionné dans le formulaire d'ajout niveau 3 est réinitialisé s'il est supprimé entre-temps (évitait une violation de contrainte).
- L'état des onglets et des lignes niveau 3 dépliées est désormais préservé lors des changements d'onglet (plus de perte de saisie ni de requêtes relancées inutilement).
- Validation du montant (revenu, dépense niveau 3) : rejette une saisie à plus de 2 décimales au lieu de l'arrondir silencieusement (pouvait ramener un montant non nul à 0 centime), et ne confond plus une virgule utilisée comme séparateur de milliers avec un séparateur décimal.
- Formulaires de revenu et de type de dépense niveau 3 protégés contre les doubles soumissions (double-tap) et contre une mise à jour après fermeture prématurée du formulaire.
- Total d'un type de dépense niveau 2 recalculé de façon cohérente avec le total niveau 1 (plus de divergence possible entre les deux).
- Sur une ligne de type de dépense niveau 3, « Modifier » reste accessible pendant qu'un montant est en cours d'enregistrement ; « Marquer absente »/« Supprimer » ne peuvent plus se déclencher pendant qu'un enregistrement est déjà en cours sur la même ligne.

### Changed

- Suppression du script `reset-project` hérité du scaffold `create-expo-app`, devenu un piège silencieux une fois le projet sorti du stade scaffold.
- Charte graphique de myBudget formalisée : palette « Sauge » (light/dark), typographie, espacements — voir `docs/design/charte-graphique.md` (#26).
- Actions « Modifier »/« Supprimer » des types de dépenses (niveaux 2 et 3) harmonisées sur le même menu « ⋮ » que l'onglet Revenus, à la place des liens texte précédents (#26).
