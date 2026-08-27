export interface MontantHistoriqueEntry {
  /** Mois à partir duquel cette entrée s'applique, format 'YYYY-MM'. */
  moisEffet: string;
  /** Montant en centimes ; `null` = dépense absente à partir de ce mois. */
  montant: number | null;
}

/**
 * Résout le montant applicable à un type de dépense niveau 3 pour un mois
 * donné, à partir de son historique de montants (voir docs/DOMAIN.md §3.3).
 *
 * Règle de résolution : on retient la dernière entrée (par mois d'effet)
 * dont le mois d'effet est <= au mois demandé. Si cette entrée a un
 * `montant` à `null`, ou si aucune entrée ne s'applique (mois antérieur à
 * toute entrée connue), la dépense est considérée absente ce mois-là.
 */
export function resolveMontantDepense(
  historique: MontantHistoriqueEntry[],
  mois: string,
): number | null {
  const derniereEntreeApplicable = historique
    .filter((entree) => entree.moisEffet <= mois)
    .reduce<MontantHistoriqueEntry | null>((plusRecente, entree) => {
      if (!plusRecente || entree.moisEffet > plusRecente.moisEffet) {
        return entree;
      }
      return plusRecente;
    }, null);

  return derniereEntreeApplicable?.montant ?? null;
}
