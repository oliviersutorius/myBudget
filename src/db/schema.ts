import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Schéma Drizzle de la base locale (SQLite via expo-sqlite).
// Exemple minimal pour démarrer : catégories de budget.
//
// Rappel projet (voir CLAUDE.md / docs/WORKFLOW.md) : la BDD est 100% locale,
// pas de backend — attention particulière aux index sur les colonnes filtrées/
// triées fréquemment (voir la commande /db-migrate).
export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('categories_name_idx').on(table.name)],
);
