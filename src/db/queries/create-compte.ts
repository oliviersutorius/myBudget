import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Insère un nouveau compte. Requête déclarative mince (comme
 * `get-comptes.ts`) : la validation (nom/banque obligatoires) est portée par
 * `validate-compte-form.ts`, testée séparément.
 */
export function createCompte(nom: string, banque: string) {
  return db.insert(comptes).values({ nom, banque });
}
