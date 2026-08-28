import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau2 } from '@/db/schema';

/**
 * Supprime un type de dépense niveau 2. Requête déclarative mince.
 * Échoue (contrainte de clé étrangère) si des types niveau 3 en dépendent
 * encore — pas de suppression en cascade (voir schema.ts).
 */
export function deleteTypeDepenseNiveau2(id: number) {
  return db.delete(typesDepenseNiveau2).where(eq(typesDepenseNiveau2.id, id));
}
