import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau2 } from '@/db/schema';

/**
 * Met à jour le libellé et le niveau 1 (fixe/variable) d'un type de dépense
 * niveau 2 existant. Requête déclarative mince, validation portée par
 * `validate-type-depense-niveau2-form.ts`.
 */
export function updateTypeDepenseNiveau2(
  id: number,
  libelle: string,
  niveau1: 'fixe' | 'variable',
) {
  return db
    .update(typesDepenseNiveau2)
    .set({ libelle, niveau1 })
    .where(eq(typesDepenseNiveau2.id, id));
}
