import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Supprime un revenu (ticket #12). Requête déclarative mince. Aucune table
 * ne référence `revenus` (voir schema.ts) : contrairement à la suppression
 * d'un type de dépense, pas de contrainte de clé étrangère à anticiper ici.
 */
export function deleteRevenu(id: number) {
  return db.delete(revenus).where(eq(revenus.id, id));
}
