# Backlog fonctionnel — myBudget

> Les epics et user stories détaillées seront définies au fil des tickets de développement, à mesure que le modèle de domaine et les règles métier (voir [`DOMAIN.md`](DOMAIN.md)) se précisent.

## Ce qui est acquis à ce stade

- Le produit cible un **utilisateur unique** (particulier solo) : pas de multi-profils, pas de partage de budget entre personnes.
- Cet utilisateur peut posséder **plusieurs comptes bancaires**, chacun avec son propre budget mensuel — **jamais agrégés** entre eux (ni calculs, ni UI).
- Le cœur fonctionnel attendu (détail complet : [`DOMAIN.md`](DOMAIN.md)) :
  - Gestion de **plusieurs comptes** (nom, banque), affichés et gérés distinctement, page d'accueil listant les comptes.
  - Référentiel de **types de dépenses** à 3 niveaux (fixe/variable → catégorie → ligne), propre à chaque compte, édité depuis la page d'édition du compte.
  - **Montants de dépenses historisés** (pas de duplication mensuelle en base si le montant est inchangé).
  - Saisie des **revenus** par compte et par mois.
  - Page récapitulative d'un compte (liste des mois) → détail d'un mois (dépenses par niveau + revenus).
  - Calcul et affichage du **montant disponible** du mois, par compte (mois calendaire).
  - **Notification locale le 1er de chaque mois** pour rappeler la saisie des revenus.
- **Explicitement hors scope actuel** : synchronisation/connexion bancaire automatique, export/import de données, agrégation/consolidation entre comptes, budget partagé entre plusieurs personnes, multilingue.

## Prochaine étape

Découpage en tickets proposé ci-dessous (voir échange avec le développeur) — à valider avant création sur GitHub.
