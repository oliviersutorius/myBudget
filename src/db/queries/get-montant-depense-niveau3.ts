import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { montantsDepenseHistorique } from '@/db/schema';

import { resolveMontantDepense } from './resolve-montant-depense';

/**
 * Récupère l'historique d'un type de dépense niveau 3 et résout le montant
 * applicable au mois demandé (voir resolveMontantDepense).
 */
export async function getMontantDepenseNiveau3(
  typeDepenseNiveau3Id: number,
  mois: string,
): Promise<number | null> {
  const historique = await db
    .select({
      moisEffet: montantsDepenseHistorique.moisEffet,
      montant: montantsDepenseHistorique.montant,
    })
    .from(montantsDepenseHistorique)
    .where(eq(montantsDepenseHistorique.typeDepenseNiveau3Id, typeDepenseNiveau3Id));

  return resolveMontantDepense(historique, mois);
}
