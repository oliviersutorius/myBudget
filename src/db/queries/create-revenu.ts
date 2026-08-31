import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Crée un revenu pour un compte, sur un mois donné (ticket #12). Requête
 * déclarative mince (comme `create-type-depense-niveau2.ts`) : la
 * validation (libellé/montant obligatoires) est portée par
 * `validate-revenu-form.ts`, testée séparément. `montant` est attendu en
 * centimes (voir src/db/schema.ts et src/utils/montant.ts).
 */
export function createRevenu(compteId: number, mois: string, libelle: string, montant: number) {
  return db.insert(revenus).values({ compteId, mois, libelle, montant });
}
