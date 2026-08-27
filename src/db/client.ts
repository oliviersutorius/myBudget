import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// Base SQLite locale unique pour myBudget (pas de backend).
const expoDb = openDatabaseSync('mybudget.db');

// SQLite n'applique les contraintes de clé étrangère que si on le demande
// explicitement par connexion.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
