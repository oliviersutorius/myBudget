import { db } from '@/db/client';
import { montantsDepenseHistorique } from '@/db/schema';

/**
 * Historise le montant d'un type de dépense niveau 3 pour un mois donné
 * (ticket #9, voir docs/DOMAIN.md §3.3) : insère une nouvelle entrée, ou
 * met à jour l'entrée existante si ce mois d'effet en a déjà une (édition
 * répétée dans le même mois) — jamais plus d'une entrée par (type, mois),
 * voir l'index unique dans schema.ts. `montant` à `null` marque la dépense
 * comme absente à partir de ce mois (voir resolve-montant-depense.ts).
 */
export function setMontantDepenseNiveau3(
  typeDepenseNiveau3Id: number,
  moisEffet: string,
  montant: number | null,
) {
  return db
    .insert(montantsDepenseHistorique)
    .values({ typeDepenseNiveau3Id, moisEffet, montant })
    .onConflictDoUpdate({
      target: [montantsDepenseHistorique.typeDepenseNiveau3Id, montantsDepenseHistorique.moisEffet],
      set: { montant },
    });
}
