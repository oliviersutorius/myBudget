---
description: Crée et applique une migration du schéma de la base de données locale (SQLite/Drizzle)
argument-hint: <description-de-la-migration>
---

Gère une migration de schéma **local** pour myBudget (SQLite via Drizzle ORM — pas de backend).

1. Modifie le schéma Drizzle (`db/schema.ts` ou équivalent) selon : **$ARGUMENTS**.
2. Génère la migration (`npx drizzle-kit generate`).
3. **Vérifie explicitement les index** sur les colonnes utilisées dans les `WHERE`, `ORDER BY` et jointures fréquentes (ex : date des transactions, catégorie, compte) — la performance sur BDD locale est une exigence du projet.
4. Écris/mets à jour les tests couvrant les requêtes affectées, y compris un test de performance basique si le volume de données est significatif (ex : 10k+ transactions).
5. Applique la migration en local et vérifie qu'elle est réversible si possible.
6. Documente le changement de schéma dans la doc technique (`/doc-update`).
