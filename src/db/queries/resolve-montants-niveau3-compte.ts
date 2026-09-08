import { resolveMontantDepense, type MontantHistoriqueEntry } from './resolve-montant-depense';

export interface LigneHistoriqueCompte extends MontantHistoriqueEntry {
  typeDepenseNiveau3Id: number;
  niveau2Id: number;
}

/** Montant déjà résolu (pas d'historique à parcourir) pour un type niveau 3 — voir `agregerMontantsNiveau3Compte`. */
export interface LigneMontantResoluCompte {
  typeDepenseNiveau3Id: number;
  niveau2Id: number;
  /** `null` = dépense absente ce mois-là (compte pour 0 dans les sommes). */
  montant: number | null;
}

export interface MontantsResolusCompte {
  /** Montant résolu (au mois demandé) par type de dépense niveau 3. */
  montantsParType3: Map<number, number | null>;
  /** Somme des montants résolus par type de dépense niveau 2 parent. */
  sommeParNiveau2: Map<number, number>;
}

/**
 * Agrège une liste de montants **déjà résolus** pour un mois donné par type
 * niveau 2 parent — une dépense résolue à `null` (absente) compte pour 0
 * dans les sommes, mais reste présente dans `montantsParType3` (à `null`,
 * pas juste absente de la map).
 *
 * Utilisée directement pour le **variable** (ticket #52) : la requête SQL
 * (`getMontantsVariableCompteQuery`) filtre déjà sur le mois exact — pas de
 * reconduction à résoudre, donc pas d'entrée `null` en pratique (un type
 * niveau 3 sans ligne pour ce mois est simplement absent de `lignes`,
 * traité à l'affichage comme une dépense `null` — voir `MontantsParType3`
 * dans `comptes/[id]/edit.tsx`). Aussi utilisée en interne par
 * `resolveMontantsNiveau3Compte` (fixe) une fois l'historique résolu, pour
 * ne pas dupliquer la logique de sommation.
 */
export function agregerMontantsNiveau3Compte(
  lignes: LigneMontantResoluCompte[],
): MontantsResolusCompte {
  const montantsParType3 = new Map<number, number | null>();
  const sommeParNiveau2 = new Map<number, number>();

  for (const { typeDepenseNiveau3Id, niveau2Id, montant } of lignes) {
    montantsParType3.set(typeDepenseNiveau3Id, montant);
    sommeParNiveau2.set(niveau2Id, (sommeParNiveau2.get(niveau2Id) ?? 0) + (montant ?? 0));
  }

  return { montantsParType3, sommeParNiveau2 };
}

/**
 * Regroupe l'historique brut d'un compte (voir
 * `getMontantsHistoriqueCompteQuery`) par type niveau 3, résout le montant
 * applicable au mois demandé pour chacun (`resolveMontantDepense`), puis
 * délègue l'agrégation par type niveau 2 parent à
 * `agregerMontantsNiveau3Compte` (ticket #9).
 *
 * Un type niveau 3 sans aucune entrée d'historique n'apparaît pas dans
 * `lignes` (jointure interne) : il est donc absent de `montantsParType3`
 * et contribue 0 aux sommes, comme une dépense explicitement marquée
 * absente — même sémantique côté totaux.
 *
 * Réservée au **fixe** : le variable (ticket #52) n'a pas de reconduction à
 * résoudre, voir `agregerMontantsNiveau3Compte` appelé directement sur le
 * résultat de `getMontantsVariableCompteQuery`.
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

  const lignesResolues: LigneMontantResoluCompte[] = [];
  for (const [typeDepenseNiveau3Id, { niveau2Id, entries }] of historiqueParType3) {
    lignesResolues.push({
      typeDepenseNiveau3Id,
      niveau2Id,
      montant: resolveMontantDepense(entries, mois),
    });
  }

  return agregerMontantsNiveau3Compte(lignesResolues);
}

/**
 * Somme toutes les valeurs d'une `sommeParNiveau2` (fixe ou variable) en un
 * seul total — la répartition par type niveau 2 n'est plus pertinente
 * au-delà de ce point (ex. montant disponible, ticket #13).
 */
export function sommeTotale(sommeParNiveau2: Map<number, number>): number {
  return [...sommeParNiveau2.values()].reduce((total, valeur) => total + valeur, 0);
}
