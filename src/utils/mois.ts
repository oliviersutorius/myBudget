/**
 * Décale un mois (format 'YYYY-MM', voir src/db/schema.ts) d'un nombre
 * donné de mois, avec report automatique sur l'année (ex. decalerMois(
 * '2026-12', 1) -> '2026-13' n'existe pas : `Date` normalise vers
 * '2027-01'). `delta` peut être négatif (mois précédent) ou positif (mois
 * suivant).
 */
export function decalerMois(mois: string, delta: number): string {
  const [annee, moisIndex] = mois.split('-').map(Number);
  const date = new Date(annee, moisIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
