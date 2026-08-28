import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau2 } from '@/db/schema';

/**
 * Requête (non exécutée) listant les types de dépense niveau 2 d'un compte,
 * par ordre de création. À utiliser avec `useLiveQuery`
 * (drizzle-orm/expo-sqlite) pour un rafraîchissement automatique de l'écran
 * à chaque création/modification/suppression.
 */
export function getTypesDepenseNiveau2Query(compteId: number) {
  return db
    .select()
    .from(typesDepenseNiveau2)
    .where(eq(typesDepenseNiveau2.compteId, compteId))
    .orderBy(asc(typesDepenseNiveau2.id));
}
