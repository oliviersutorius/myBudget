/**
 * Calcule le montant disponible d'un compte pour un mois donné (ticket #13,
 * voir docs/GLOSSARY.md — terme officiel, jamais "argent de poche") :
 * revenus du mois moins dépenses (fixe + variable) du mois, **pour ce compte
 * uniquement** — jamais agrégé avec d'autres comptes (docs/DOMAIN.md).
 *
 * Prend des totaux déjà résolus/sommés (voir `sommeTotale` pour réduire un
 * `sommeParNiveau2` de `resolveMontantsNiveau3Compte`/`agregerMontantsNiveau3Compte`
 * à un total, `sommerMontants` pour sommer une liste de revenus) plutôt que
 * les `Map`/listes elles-mêmes : la répartition par type niveau 2 ne sert à
 * rien à ce stade du calcul. Tous les montants sont en centimes (voir
 * src/db/schema.ts) ; le résultat peut être négatif (dépenses supérieures
 * aux revenus du mois).
 */
export function calculerMontantDisponible(params: {
  sommeRevenus: number;
  sommeDepensesFixe: number;
  sommeDepensesVariable: number;
}): number {
  return params.sommeRevenus - params.sommeDepensesFixe - params.sommeDepensesVariable;
}

/** Somme le `montant` d'une liste de lignes (ex. revenus d'un mois) — utilisée
 * à la fois par `RevenusTab` (total affiché) et `BudgetTab` (montant
 * disponible, ticket #13) pour ne pas dupliquer cette réduction. */
export function sommerMontants(lignes: { montant: number }[]): number {
  return lignes.reduce((total, ligne) => total + ligne.montant, 0);
}
