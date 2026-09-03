import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Supprime un compte. Requête déclarative mince.
 * Échoue (contrainte de clé étrangère) si des types de dépense niveau 2 ou
 * des revenus dépendent encore de ce compte — pas de suppression en cascade
 * (voir schema.ts). Implémente la règle "suppression bloquée si historique
 * existant" (docs/DOMAIN.md § invariants) pour les comptes, ticket #16.
 *
 * Approximation assumée (identique à delete-type-depense-niveau2/niveau3) :
 * le texte de l'invariant parle d'historique "sur un mois passé", mais la
 * contrainte FK bloque dès qu'une ligne dépendante existe, quel que soit son
 * mois (ex. une catégorie niveau 2 vide ou un revenu du mois courant
 * empêchent déjà la suppression). Distinguer "vraie" contrainte
 * chronologique nécessiterait de résoudre l'historique du compte à la
 * suppression plutôt que de s'appuyer sur la contrainte SQLite — pas fait
 * ici, à revoir si ce raccourci gêne en usage réel.
 */
export function deleteCompte(id: number) {
  return db.delete(comptes).where(eq(comptes.id, id));
}
