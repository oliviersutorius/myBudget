import { and, eq, like } from 'drizzle-orm';

import { db } from '@/db/client';
import { montantsDepenseVariable, typesDepenseNiveau2, typesDepenseNiveau3 } from '@/db/schema';

/**
 * Requête (non exécutée) listant, pour un compte et une année donnée, tous
 * les montants de dépense **variable** saisis cette année-là (ticket #13) —
 * variante de `getMontantsVariableCompteQuery` (un seul mois exact) élargie
 * à l'année, pour calculer le montant disponible de chaque mois du
 * récapitulatif (`BudgetTab`) en une seule requête plutôt qu'une par mois
 * affiché. Toujours sans reconduction (#52) : chaque ligne correspond
 * exactement au mois où elle a été saisie, à regrouper côté appelant via son
 * champ `mois`.
 */
export function getMontantsVariableCompteAnneeQuery(compteId: number, annee: number) {
  return db
    .select({
      typeDepenseNiveau3Id: montantsDepenseVariable.typeDepenseNiveau3Id,
      niveau2Id: typesDepenseNiveau3.niveau2Id,
      mois: montantsDepenseVariable.mois,
      montant: montantsDepenseVariable.montant,
    })
    .from(montantsDepenseVariable)
    .innerJoin(
      typesDepenseNiveau3,
      eq(typesDepenseNiveau3.id, montantsDepenseVariable.typeDepenseNiveau3Id),
    )
    .innerJoin(typesDepenseNiveau2, eq(typesDepenseNiveau2.id, typesDepenseNiveau3.niveau2Id))
    .where(
      and(
        eq(typesDepenseNiveau2.compteId, compteId),
        like(montantsDepenseVariable.mois, `${annee}-%`),
      ),
    );
}
