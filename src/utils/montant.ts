/**
 * Parse une saisie utilisateur de montant en euros (ex. "12,50" ou "12.5")
 * vers un montant en centimes (entier), comme stocké en base (voir
 * src/db/schema.ts). Retourne `null` si la saisie n'est pas un nombre
 * strictement positif (un montant nul, négatif ou non numérique est rejeté).
 */
export function parseMontantEnCentimes(saisie: string): number | null {
  const normalise = saisie.trim().replace(',', '.');

  if (normalise.length === 0) {
    return null;
  }

  const valeur = Number(normalise);

  if (!Number.isFinite(valeur) || valeur <= 0) {
    return null;
  }

  return Math.round(valeur * 100);
}

/**
 * Formate un montant en centimes vers un affichage euros localisé
 * (ex. 1234 -> "12,34 €").
 */
export function formatCentimesEnEuros(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(centimes / 100);
}
