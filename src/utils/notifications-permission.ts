import * as Notifications from 'expo-notifications';

/**
 * Demande la permission de notifications à l'utilisateur, uniquement si
 * elle n'a jamais été tranchée (`undetermined`) — ni accordée, ni refusée.
 * Ce garde-fou évite de redéclencher le prompt système à chaque appel
 * (ticket #19, critère « pas de rappel intempestif de redemander à chaque
 * lancement ») : à appeler sans condition côté appelant, au moment jugé
 * pertinent (ici, la création du premier compte — voir comptes/create.tsx),
 * plutôt que de dupliquer la vérification à chaque site d'appel.
 *
 * Ne bloque jamais l'écran appelant : conçue pour être utilisée en
 * fire-and-forget, l'app doit rester pleinement utilisable que la
 * permission soit accordée, refusée, ou pas encore demandée — aucune
 * fonctionnalité actuelle de myBudget n'en dépend (le rappel du 1er du
 * mois, ticket #14, n'est pas encore implémenté).
 */
export async function demanderPermissionNotificationsSiNecessaire(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();

  if (status === 'undetermined') {
    await Notifications.requestPermissionsAsync();
  }
}
