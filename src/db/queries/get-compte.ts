import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { comptes } from '@/db/schema';

/**
 * Requête (non exécutée) chargeant un compte par id. Requête déclarative
 * mince (comme `get-comptes.ts`) : rien à tester unitairement.
 */
export function getCompteQuery(id: number) {
  return db.select().from(comptes).where(eq(comptes.id, id));
}
