import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { typesDepenseNiveau3 } from '@/db/schema';

/**
 * Supprime un type de dépense niveau 3. Requête déclarative mince.
 * Aucune dépendance ne peut encore le référencer à ce stade (l'historique
 * des montants — ticket #9 — n'existe pas), donc pas de contrainte de clé
 * étrangère à gérer ici pour l'instant.
 */
export function deleteTypeDepenseNiveau3(id: number) {
  return db.delete(typesDepenseNiveau3).where(eq(typesDepenseNiveau3.id, id));
}
