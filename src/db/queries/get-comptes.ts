import { asc } from 'drizzle-orm';

import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Requête (non exécutée) listant tous les comptes, par ordre de création.
 * À utiliser avec `useLiveQuery` (drizzle-orm/expo-sqlite) pour un
 * rafraîchissement automatique de l'écran à chaque création/modification.
 */
export function getComptesQuery() {
  return db.select().from(comptes).orderBy(asc(comptes.id));
}
