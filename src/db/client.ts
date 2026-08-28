import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// Base SQLite locale unique pour myBudget (pas de backend).
// `enableChangeListener` est nécessaire pour que `useLiveQuery`
// (drizzle-orm/expo-sqlite) rafraîchisse les écrans après une écriture faite
// ailleurs (ex. liste des comptes après création sur un autre écran) —
// désactivé par défaut côté expo-sqlite.
const expoDb = openDatabaseSync('mybudget.db', { enableChangeListener: true });

// SQLite n'applique les contraintes de clé étrangère que si on le demande
// explicitement par connexion.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
