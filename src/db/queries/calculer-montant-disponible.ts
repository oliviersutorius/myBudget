/**
 * Calcule le montant disponible d'un compte pour un mois donné (ticket #13,
 * voir docs/GLOSSARY.md — terme officiel, jamais "argent de poche") :
 * revenus du mois moins dépenses (fixe + variable) du mois, **pour ce compte
 * uniquement** — jamais agrégé avec d'autres comptes (docs/DOMAIN.md).
 *
 * Les dépenses fixe et variable sont déjà résolues/agrégées en amont :
 * `sommeParNiveau2Fixe` vient de `resolveMontantsNiveau3Compte` (historique
 * résolu au mois demandé, voir #9/#17), `sommeParNiveau2Variable` de
 * `agregerMontantsNiveau3Compte` sur les lignes du mois exact (#52, pas de
 * reconduction). Ce calcul ne fait que sommer ces deux `Map` (déjà réparties
 * par type niveau 2, non réutilisée ici) et les soustraire aux revenus.
 *
 * Tous les montants sont en centimes (voir src/db/schema.ts) ; le résultat
 * peut être négatif (dépenses supérieures aux revenus du mois).
 */
export function calculerMontantDisponible(params: {
  sommeRevenus: number;
  sommeParNiveau2Fixe: Map<number, number>;
  sommeParNiveau2Variable: Map<number, number>;
}): number {
  return (
    params.sommeRevenus -
    sommeMap(params.sommeParNiveau2Fixe) -
    sommeMap(params.sommeParNiveau2Variable)
  );
}

function sommeMap(montants: Map<number, number>): number {
  return [...montants.values()].reduce((total, valeur) => total + valeur, 0);
}
