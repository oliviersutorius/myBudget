import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Requête (non exécutée) listant les revenus d'un compte pour un mois donné
 * (format 'YYYY-MM'), par ordre de création. À utiliser avec `useLiveQuery`
 * (drizzle-orm/expo-sqlite) pour un rafraîchissement automatique de l'écran
 * à chaque ajout (ticket #12).
 */
export function getRevenusQuery(compteId: number, mois: string) {
  return db
    .select()
    .from(revenus)
    .where(and(eq(revenus.compteId, compteId), eq(revenus.mois, mois)))
    .orderBy(asc(revenus.id));
}
