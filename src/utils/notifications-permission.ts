import * as Notifications from 'expo-notifications';

/**
 * Demande la permission de notifications à l'utilisateur, uniquement si
 * elle n'a jamais été tranchée (`undetermined`) — ni accordée, ni refusée.
 * Ce garde-fou évite de redéclencher le prompt système une fois la décision
 * de l'utilisateur prise (ticket #19, critère « pas de rappel intempestif
 * de redemander à chaque lancement »), tout en continuant à retenter tant
 * qu'elle ne l'est pas (ex. utilisateur qui a mis l'app en arrière-plan
 * sans répondre au prompt système) : à appeler sans condition côté
 * appelant, à chaque moment jugé pertinent (voir comptes/create.tsx),
 * plutôt que de dupliquer la vérification à chaque site d'appel.
 *
 * Ne fait jamais planter ni bloquer l'écran appelant : conçue pour être
 * utilisée en fire-and-forget (jamais de rejet, jamais d'`await` requis
 * côté appelant), l'app doit rester pleinement utilisable que la
 * permission soit accordée, refusée, ou pas encore demandée — aucune
 * fonctionnalité actuelle de myBudget n'en dépend (le rappel du 1er du
 * mois, ticket #14, n'est pas encore implémenté). Une erreur inattendue
 * (pas un simple refus, qui ne lève pas d'exception) est tout de même
 * signalée en console plutôt que silencieusement avalée : sinon, une
 * régression du flux de permission (ex. après une montée de version
 * d'Expo) passerait inaperçue jusqu'à ce que #14, construit dessus, ne se
 * déclenche jamais sans que personne ne sache pourquoi.
 */
export async function demanderPermissionNotificationsSiNecessaire(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'undetermined') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.warn('Échec de la demande de permission de notifications :', error);
  }
}
