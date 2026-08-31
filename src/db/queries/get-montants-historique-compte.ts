import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { montantsDepenseHistorique, typesDepenseNiveau2, typesDepenseNiveau3 } from '@/db/schema';

/**
 * Requête (non exécutée) listant, pour un compte entier, tout l'historique
 * de montants de ses types de dépense niveau 3 (toutes lignes, toutes
 * entrées d'historique confondues). Une seule requête pour tout l'onglet
 * Dépenses (voir DepensesTab) plutôt qu'une par ligne niveau 3 — à
 * regrouper par type et résoudre par mois via
 * `resolveMontantsNiveau3Compte`.
 */
export function getMontantsHistoriqueCompteQuery(compteId: number) {
  return db
    .select({
      typeDepenseNiveau3Id: montantsDepenseHistorique.typeDepenseNiveau3Id,
      niveau2Id: typesDepenseNiveau3.niveau2Id,
      moisEffet: montantsDepenseHistorique.moisEffet,
      montant: montantsDepenseHistorique.montant,
    })
    .from(montantsDepenseHistorique)
    .innerJoin(
      typesDepenseNiveau3,
      eq(typesDepenseNiveau3.id, montantsDepenseHistorique.typeDepenseNiveau3Id),
    )
    .innerJoin(typesDepenseNiveau2, eq(typesDepenseNiveau2.id, typesDepenseNiveau3.niveau2Id))
    .where(eq(typesDepenseNiveau2.compteId, compteId));
}
