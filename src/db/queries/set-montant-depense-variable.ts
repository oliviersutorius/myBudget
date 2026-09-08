import { db } from '@/db/client';
import { montantsDepenseVariable } from '@/db/schema';

/**
 * Enregistre le montant d'un type de dépense niveau 3 **variable** pour un
 * mois précis (ticket #52, voir docs/DOMAIN.md §3.3) : insère une nouvelle
 * ligne, ou met à jour la ligne existante si ce (type, mois) en a déjà une
 * (édition répétée dans le même mois) — jamais plus d'une ligne par (type,
 * mois), voir l'index unique dans schema.ts. Contrairement au fixe
 * (`setMontantDepenseNiveau3`), aucune reconduction sur les mois suivants :
 * une ligne ne concerne que le mois passé en paramètre.
 */
export function setMontantDepenseVariable(
  typeDepenseNiveau3Id: number,
  mois: string,
  montant: number,
) {
  return db
    .insert(montantsDepenseVariable)
    .values({ typeDepenseNiveau3Id, mois, montant })
    .onConflictDoUpdate({
      target: [montantsDepenseVariable.typeDepenseNiveau3Id, montantsDepenseVariable.mois],
      set: { montant },
    });
}
