import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Met à jour le nom et la banque d'un compte existant. Requête déclarative
 * mince (comme `create-compte.ts`) : la validation (nom/banque
 * obligatoires) est portée par `validate-compte-form.ts`, testée
 * séparément.
 */
export function updateCompte(id: number, nom: string, banque: string) {
  return db.update(comptes).set({ nom, banque }).where(eq(comptes.id, id));
}
