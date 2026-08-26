import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// Base SQLite locale unique pour myBudget (pas de backend).
const expoDb = openDatabaseSync('mybudget.db');

export const db = drizzle(expoDb, { schema });
