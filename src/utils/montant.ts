// N'accepte qu'un nombre entier optionnellement suivi d'1 ou 2 décimales
// (virgule ou point). Rejette explicitement toute saisie plus précise que
// le centime (voir schema.ts : montants stockés en centimes) plutôt que de
// l'arrondir silencieusement — ce qui évite à la fois qu'un montant non nul
// s'arrondisse à 0 centime, et qu'une virgule utilisée comme séparateur de
// milliers (ex. "1,500" pour 1500) soit mal interprétée comme décimale.
const MONTANT_REGEX = /^\d+([.,]\d{1,2})?$/;

/**
 * Parse une saisie utilisateur de montant en euros (ex. "12,50" ou "12.5")
 * vers un montant en centimes (entier), comme stocké en base (voir
 * src/db/schema.ts). Retourne `null` si la saisie n'est pas un nombre
 * strictement positif à au plus 2 décimales.
 */
export function parseMontantEnCentimes(saisie: string): number | null {
  const normalise = saisie.trim();

  if (!MONTANT_REGEX.test(normalise)) {
    return null;
  }

  const valeur = Number(normalise.replace(',', '.'));

  if (!Number.isFinite(valeur) || valeur <= 0) {
    return null;
  }

  return Math.round(valeur * 100);
}

const FORMATEUR_EUROS = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Formate un montant en centimes vers un affichage euros localisé
 * (ex. 1234 -> "12,34 €").
 */
export function formatCentimesEnEuros(centimes: number): string {
  return FORMATEUR_EUROS.format(centimes / 100);
}
