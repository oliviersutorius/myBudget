/**
 * Détecte une erreur de contrainte de clé étrangère SQLite (`PRAGMA foreign_keys
 * = ON`, voir src/db/client.ts) : le seul signal disponible côté app est le
 * texte brut de l'erreur native, `drizzle-orm`/`expo-sqlite` ne distinguant
 * pas ce cas par un type ou un code dédié.
 *
 * Extrait en fonction pure et testée (repris identique dans 3 écrans avant
 * ce ticket #16 : suppression d'un type niveau 2, niveau 3, d'un compte)
 * pour ne garder la fragilité du match texte qu'en un seul endroit.
 */
export function estErreurContrainteForeignKey(error: unknown): boolean {
  return error instanceof Error && error.message.includes('FOREIGN KEY constraint failed');
}
