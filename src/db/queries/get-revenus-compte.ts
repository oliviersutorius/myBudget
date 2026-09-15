import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { revenus } from '@/db/schema';

/**
 * Requête (non exécutée) détectant l'existence d'au moins un revenu
 * rattaché à un compte, tous mois confondus — `limit(1)` : sert uniquement
 * à vérifier une présence, pas à lister (voir `getRevenusQuery`/
 * `getRevenusAnneeQuery`, filtrées par mois/année pour l'affichage).
 *
 * Utilisée par `EditionCompteScreen` (onglet Infos, ticket #67) pour
 * détecter *proactivement* si la suppression du compte serait bloquée par
 * la contrainte de clé étrangère sur `revenus.compte_id` — cohérente avec
 * l'approximation déjà documentée dans `delete-compte.ts` (« présence de
 * lignes dépendantes », pas seulement « historique sur un mois passé »).
 * Le pendant niveau 2 (`typesDepenseNiveau2.compteId`) est déjà couvert par
 * `getTypesDepenseNiveau2Query`, chargée compte-wide par
 * `EditionCompteScreen` pour d'autres besoins — pas de requête dédiée pour
 * ce côté-là.
 */
export function getRevenusCompteQuery(compteId: number) {
  return db.select({ id: revenus.id }).from(revenus).where(eq(revenus.compteId, compteId)).limit(1);
}
