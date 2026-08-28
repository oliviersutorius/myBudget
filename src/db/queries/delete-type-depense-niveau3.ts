import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau3 } from '@/db/schema';

/**
 * Supprime un type de dépense niveau 3. Requête déclarative mince.
 * La table `montants_depense_historique` référence déjà ce niveau 3 par
 * clé étrangère (schéma initial, ticket #1) : aucune ligne n'y est encore
 * insérée avant le ticket #9, donc la contrainte ne peut pas encore
 * bloquer une suppression — mais elle le pourra dès #9, voir
 * `TypeDepenseNiveau3Row` dans `comptes/[id]/edit.tsx` qui gère déjà ce cas.
 */
export function deleteTypeDepenseNiveau3(id: number) {
  return db.delete(typesDepenseNiveau3).where(eq(typesDepenseNiveau3.id, id));
}
