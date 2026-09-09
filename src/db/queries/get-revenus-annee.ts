import { and, asc, eq, like } from 'drizzle-orm';

import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Requête (non exécutée) listant les revenus d'un compte pour une année
 * entière (format 'YYYY'), par ordre de création — variante de
 * `getRevenusQuery` (un seul mois) utilisée par le récapitulatif mensuel
 * (`BudgetTab`, ticket #13) pour calculer le montant disponible de chaque
 * mois affiché en une seule requête plutôt qu'une par mois.
 */
export function getRevenusAnneeQuery(compteId: number, annee: number) {
  return db
    .select()
    .from(revenus)
    .where(and(eq(revenus.compteId, compteId), like(revenus.mois, `${annee}-%`)))
    .orderBy(asc(revenus.id));
}
