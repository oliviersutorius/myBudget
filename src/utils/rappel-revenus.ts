import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

/**
 * Identifiant fixe et stable de la notification de rappel (ticket #14) :
 * reprogrammer avec ce même identifiant écrase la programmation existante
 * plutôt que d'en créer une nouvelle en double — permet d'appeler
 * `programmerRappelRevenusMensuel` sans condition à chaque lancement de
 * l'app (voir _layout.tsx) et juste après l'octroi de la permission (voir
 * comptes/create.tsx), sans avoir à suivre nous-mêmes si elle est déjà
 * programmée.
 */
export const IDENTIFIANT_RAPPEL_REVENUS = 'rappel-revenus-mensuel';

const CANAL_ANDROID = 'rappels';

/**
 * Programme (ou reprogramme) la notification locale récurrente du 1er du
 * mois invitant à saisir les revenus du mois (ticket #14) — no-op si la
 * permission de notifications n'a pas été accordée (voir
 * src/utils/notifications-permission.ts) : pas la peine de programmer une
 * notification qui ne s'affichera jamais, et rien à défaire explicitement
 * si la permission est révoquée ensuite depuis les réglages système, l'OS
 * n'affichant de toute façon plus rien dans ce cas.
 *
 * Best-effort, comme `demanderPermissionNotificationsSiNecessaire` : ne
 * lève jamais, une erreur inattendue est signalée en console plutôt que
 * silencieusement avalée.
 */
export async function programmerRappelRevenusMensuel(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    if (Platform.OS === 'android') {
      // Requis sur Android 8+ pour qu'une notification programmée
      // s'affiche : sans canal explicite, le système utilise un canal par
      // défaut sans nom ni réglages, non recommandé par la documentation
      // Android. Rappelable sans risque à chaque programmation (idempotent
      // côté natif si le canal existe déjà).
      await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
        name: 'Rappels',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIANT_RAPPEL_REVENUS,
      content: {
        title: 'Nouveau mois sur myBudget',
        body: 'Pensez à saisir vos revenus du mois.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: 1,
        hour: 9,
        minute: 0,
        channelId: CANAL_ANDROID,
      },
    });
  } catch (error) {
    console.warn('Échec de la programmation du rappel de revenus mensuel :', error);
  }
}
