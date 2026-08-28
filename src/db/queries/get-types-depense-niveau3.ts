import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau3 } from '@/db/schema';

/**
 * Requête (non exécutée) listant les types de dépense niveau 3 d'un type
 * niveau 2, par ordre de création. À utiliser avec `useLiveQuery`
 * (drizzle-orm/expo-sqlite) pour un rafraîchissement automatique de l'écran
 * à chaque création/modification/suppression.
 */
export function getTypesDepenseNiveau3Query(niveau2Id: number) {
  return db
    .select()
    .from(typesDepenseNiveau3)
    .where(eq(typesDepenseNiveau3.niveau2Id, niveau2Id))
    .orderBy(asc(typesDepenseNiveau3.id));
}
