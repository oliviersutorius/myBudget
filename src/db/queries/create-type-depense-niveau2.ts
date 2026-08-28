import { db } from '@/db/client';
import { typesDepenseNiveau2 } from '@/db/schema';

/**
 * Crée un type de dépense niveau 2 pour un compte. Requête déclarative
 * mince (comme `create-compte.ts`) : la validation (libellé/niveau1
 * obligatoires) est portée par `validate-type-depense-niveau2-form.ts`,
 * testée séparément.
 */
export function createTypeDepenseNiveau2(
  compteId: number,
  libelle: string,
  niveau1: 'fixe' | 'variable',
) {
  return db.insert(typesDepenseNiveau2).values({ compteId, libelle, niveau1 });
}
