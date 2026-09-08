import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { montantsDepenseVariable, typesDepenseNiveau2, typesDepenseNiveau3 } from '@/db/schema';

/**
 * Requête (non exécutée) listant, pour un compte et un mois donné, les
 * montants de dépense **variable** effectivement saisis ce mois-là (voir
 * ticket #52). Contrairement à `getMontantsHistoriqueCompteQuery` (fixe), pas
 * de reconduction : chaque ligne ici correspond exactement au mois demandé,
 * filtré directement en SQL — pas besoin de charger tout l'historique du
 * compte pour résoudre "la dernière valeur connue". Un type niveau 3 sans
 * ligne pour ce mois n'apparaît simplement pas dans le résultat (non saisi
 * ce mois-là), voir `agregerMontantsNiveau3Compte`.
 */
export function getMontantsVariableCompteQuery(compteId: number, mois: string) {
  return db
    .select({
      typeDepenseNiveau3Id: montantsDepenseVariable.typeDepenseNiveau3Id,
      niveau2Id: typesDepenseNiveau3.niveau2Id,
      montant: montantsDepenseVariable.montant,
    })
    .from(montantsDepenseVariable)
    .innerJoin(
      typesDepenseNiveau3,
      eq(typesDepenseNiveau3.id, montantsDepenseVariable.typeDepenseNiveau3Id),
    )
    .innerJoin(typesDepenseNiveau2, eq(typesDepenseNiveau2.id, typesDepenseNiveau3.niveau2Id))
    .where(and(eq(typesDepenseNiveau2.compteId, compteId), eq(montantsDepenseVariable.mois, mois)));
}
