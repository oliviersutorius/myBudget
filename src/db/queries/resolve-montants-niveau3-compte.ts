import { resolveMontantDepense, type MontantHistoriqueEntry } from './resolve-montant-depense';

export interface LigneHistoriqueCompte extends MontantHistoriqueEntry {
  typeDepenseNiveau3Id: number;
  niveau2Id: number;
}

export interface MontantsResolusCompte {
  /** Montant résolu (au mois demandé) par type de dépense niveau 3. */
  montantsParType3: Map<number, number | null>;
  /** Somme des montants résolus par type de dépense niveau 2 parent. */
  sommeParNiveau2: Map<number, number>;
}

/**
 * Regroupe l'historique brut d'un compte (voir
 * `getMontantsHistoriqueCompteQuery`) par type niveau 3, résout le montant
 * applicable au mois demandé pour chacun (`resolveMontantDepense`), puis
 * agrège ces montants résolus par type niveau 2 parent — une dépense
 * absente (résolue à `null`) compte pour 0 dans les sommes (ticket #9).
 *
 * Un type niveau 3 sans aucune entrée d'historique n'apparaît pas dans
 * `lignes` (jointure interne) : il est donc absent de `montantsParType3`
 * et contribue 0 aux sommes, comme une dépense explicitement marquée
 * absente — même sémantique côté totaux.
 */
export function resolveMontantsNiveau3Compte(
  lignes: LigneHistoriqueCompte[],
  mois: string,
): MontantsResolusCompte {
  const historiqueParType3 = new Map<
    number,
    { niveau2Id: number; entries: MontantHistoriqueEntry[] }
  >();

  for (const ligne of lignes) {
    const groupe = historiqueParType3.get(ligne.typeDepenseNiveau3Id) ?? {
      niveau2Id: ligne.niveau2Id,
      entries: [],
    };
    groupe.entries.push({ moisEffet: ligne.moisEffet, montant: ligne.montant });
    historiqueParType3.set(ligne.typeDepenseNiveau3Id, groupe);
  }

  const montantsParType3 = new Map<number, number | null>();
  const sommeParNiveau2 = new Map<number, number>();

  for (const [type3Id, { niveau2Id, entries }] of historiqueParType3) {
    const resolu = resolveMontantDepense(entries, mois);
    montantsParType3.set(type3Id, resolu);
    sommeParNiveau2.set(niveau2Id, (sommeParNiveau2.get(niveau2Id) ?? 0) + (resolu ?? 0));
  }

  return { montantsParType3, sommeParNiveau2 };
}
