import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau3 } from '@/db/schema';

/**
 * Met à jour le libellé d'un type de dépense niveau 3 existant. Requête
 * déclarative mince, validation portée par
 * `validate-type-depense-niveau3-form.ts`.
 */
export function updateTypeDepenseNiveau3(id: number, libelle: string) {
  return db.update(typesDepenseNiveau3).set({ libelle }).where(eq(typesDepenseNiveau3.id, id));
}
