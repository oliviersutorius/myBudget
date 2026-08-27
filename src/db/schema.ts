import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Schéma Drizzle de la base locale (SQLite via expo-sqlite).
//
// Rappel projet (voir CLAUDE.md / docs/DOMAIN.md) : la BDD est 100% locale,
// pas de backend. Un compte n'est jamais agrégé avec un autre : toute table
// métier (hors `comptes`) est rattachée à un compte, directement ou via la
// hiérarchie des types de dépenses.
//
// Les montants sont stockés en centimes (integer) pour éviter les erreurs
// d'arrondi en virgule flottante. Les règles de validation à la saisie
// (signe, précision) restent à trancher — voir le ticket #18.

export const comptes = sqliteTable('comptes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nom: text('nom').notNull(),
  banque: text('banque').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Le niveau 1 (fixe/variable) n'est jamais saisi directement par
// l'utilisateur : il est fixé à la création d'un type niveau 2 et
// s'applique à tous les types niveau 3 qui en dépendent.
export const typesDepenseNiveau2 = sqliteTable(
  'types_depense_niveau2',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    compteId: integer('compte_id')
      .notNull()
      .references(() => comptes.id),
    libelle: text('libelle').notNull(),
    niveau1: text('niveau1', { enum: ['fixe', 'variable'] }).notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('types_depense_niveau2_compte_id_idx').on(table.compteId)],
);

export const typesDepenseNiveau3 = sqliteTable(
  'types_depense_niveau3',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    niveau2Id: integer('niveau2_id')
      .notNull()
      .references(() => typesDepenseNiveau2.id),
    libelle: text('libelle').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('types_depense_niveau3_niveau2_id_idx').on(table.niveau2Id)],
);

// Historisation par changement du montant d'un type de dépense niveau 3 :
// une ligne n'est créée qu'au moment d'un changement de valeur (nouveau
// montant, disparition, réapparition) — jamais une ligne par mois écoulé.
// Résolution du montant applicable à un mois donné :
// voir src/db/queries/resolve-montant-depense.ts.
export const montantsDepenseHistorique = sqliteTable(
  'montants_depense_historique',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    typeDepenseNiveau3Id: integer('type_depense_niveau3_id')
      .notNull()
      .references(() => typesDepenseNiveau3.id),
    // Mois à partir duquel cette valeur s'applique, format 'YYYY-MM'.
    moisEffet: text('mois_effet').notNull(),
    // Montant en centimes ; `null` = dépense absente à partir de ce mois.
    montant: integer('montant'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index('montants_depense_historique_type_id_idx').on(table.typeDepenseNiveau3Id),
    uniqueIndex('montants_depense_historique_type_mois_idx').on(
      table.typeDepenseNiveau3Id,
      table.moisEffet,
    ),
  ],
);

export const revenus = sqliteTable(
  'revenus',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    compteId: integer('compte_id')
      .notNull()
      .references(() => comptes.id),
    // Mois du revenu, format 'YYYY-MM' (pas de table Mois dédiée : le mois
    // est dérivé d'une date, voir docs/DOMAIN.md §3.5).
    mois: text('mois').notNull(),
    libelle: text('libelle').notNull(),
    // Montant en centimes.
    montant: integer('montant').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('revenus_compte_id_mois_idx').on(table.compteId, table.mois)],
);
