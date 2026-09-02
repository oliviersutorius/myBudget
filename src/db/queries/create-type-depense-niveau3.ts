import { db } from '@/db/client';
import { typesDepenseNiveau3 } from '@/db/schema';

/**
 * Crée un type de dépense niveau 3 sous un niveau 2. Requête déclarative
 * mince (comme `create-type-depense-niveau2.ts`) : la validation (libellé
 * obligatoire) est portée par `validate-type-depense-niveau3-form.ts`,
 * testée séparément. Pas de niveau1 ici : il est hérité du niveau 2 parent
 * (voir docs/DOMAIN.md §3.2).
 *
 * `.returning()` l'id inséré : la popup d'ajout niveau 3 (ticket #41) pose
 * le montant du mois courant juste après la création
 * (`setMontantDepenseNiveau3`), elle a donc besoin de l'id sans requête
 * séparée.
 */
export function createTypeDepenseNiveau3(niveau2Id: number, libelle: string) {
  return db
    .insert(typesDepenseNiveau3)
    .values({ niveau2Id, libelle })
    .returning({ id: typesDepenseNiveau3.id });
}
