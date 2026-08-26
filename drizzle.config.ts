import type { Config } from 'drizzle-kit';

// Configuration Drizzle Kit pour la base SQLite locale (expo-sqlite).
// `npx drizzle-kit generate` génère les migrations dans ./drizzle à partir de src/db/schema.ts.
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
