import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Met à jour le libellé et le montant d'un revenu existant (ticket #12).
 * Requête déclarative mince (comme `update-type-depense-niveau2.ts`) : la
 * validation est portée par `validate-revenu-form.ts`. Le mois et le compte
 * ne sont jamais modifiables ici — seul un nouveau revenu peut être créé
 * sur un autre mois (voir create-revenu.ts).
 */
export function updateRevenu(id: number, libelle: string, montant: number) {
  return db.update(revenus).set({ libelle, montant }).where(eq(revenus.id, id));
}
