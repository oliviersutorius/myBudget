import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { montantsDepenseVariable } from '@/db/schema';

/**
 * Efface la saisie d'un type de dépense niveau 3 **variable** pour un mois
 * précis (ticket #52) : supprime la ligne `(type, mois)` si elle existe.
 * Équivalent fonctionnel de « Marquer absente » côté fixe
 * (`setMontantDepenseNiveau3(id, mois, null)`), mais par suppression plutôt
 * que par valeur `null` — le variable ne conserve jamais de ligne pour un
 * mois non saisi (voir schema.ts).
 */
export function deleteMontantDepenseVariable(typeDepenseNiveau3Id: number, mois: string) {
  return db
    .delete(montantsDepenseVariable)
    .where(
      and(
        eq(montantsDepenseVariable.typeDepenseNiveau3Id, typeDepenseNiveau3Id),
        eq(montantsDepenseVariable.mois, mois),
      ),
    );
}
