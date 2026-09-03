import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Supprime un compte. Requête déclarative mince.
 * Échoue (contrainte de clé étrangère) si des types de dépense niveau 2 ou
 * des revenus dépendent encore de ce compte — pas de suppression en cascade
 * (voir schema.ts). Implémente la règle "suppression bloquée si historique
 * existant" (docs/DOMAIN.md § invariants) pour les comptes, ticket #16.
 */
export function deleteCompte(id: number) {
  return db.delete(comptes).where(eq(comptes.id, id));
}
