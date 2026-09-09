import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { NotificationResponse } from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ConfirmationSuppressionPopup } from '@/components/confirmation-suppression-popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/db/client';
import { chargerModuleNotifications } from '@/utils/notifications-module';
import { IDENTIFIANT_RAPPEL_REVENUS, programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

// Sans handler explicite, une notification qui se déclencherait pendant que
// l'app est déjà au premier plan (ex. laissée ouverte jusqu'après minuit le
// 1er du mois, ticket #14) ne s'afficherait pas du tout — comportement par
// défaut d'expo-notifications, qui viderait le rappel de son intérêt dans ce
// cas précis. Appelé une seule fois au chargement du module, avant même le
// montage de RootLayout — pas de try/catch nécessaire ici ni dans l'effet
// ci-dessous qui appelle aussi chargerModuleNotifications() : cette fonction
// ne lève jamais (Expo Go et tout échec inattendu du chargement lui-même y
// sont interceptés, voir notifications-module.ts) — important à ce niveau
// précis, exécuté avant tout ErrorBoundary. `import type` ci-dessus n'a lui
// aucun effet à l'exécution (erasé à la compilation, jamais un `import` réel
// du module).
chargerModuleNotifications()?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { success: migrationsReady, error: migrationsError } = useMigrations(db, migrations);

  useEffect(() => {
    if (migrationsError) {
      // AnimatedSplashOverlay (seul appelant de hideAsync() du projet) n'est
      // jamais monté sur cette branche : sans cet appel explicite, le splash
      // natif resterait affiché indéfiniment par-dessus le message d'erreur.
      SplashScreen.hideAsync();
    }
  }, [migrationsError]);

  useEffect(() => {
    if (!migrationsReady) {
      return;
    }

    // Reprogrammé à chaque lancement plutôt que mémorisé quelque part :
    // idempotent (identifiant fixe, voir rappel-revenus.ts) et sans effet
    // si la permission n'est pas accordée, ça garantit que le rappel #14
    // reste actif tant que la permission l'est, y compris après un
    // événement qui aurait pu annuler la programmation côté OS (ex.
    // réinstallation) sans qu'il faille le détecter nous-mêmes.
    programmerRappelRevenusMensuel();
  }, [migrationsReady]);

  useEffect(() => {
    const Notifications = chargerModuleNotifications();
    if (!Notifications) {
      return;
    }

    // Un seul type de notification existe actuellement (le rappel #14) :
    // simple comparaison d'identifiant plutôt qu'une table
    // identifiant → route. Si un 2e type de notification apparaît un jour,
    // remplacer par une table de correspondance à cet endroit précis — le
    // seul point d'entrée du tap sur une notification, cold start compris.
    const ouvrirAccueilSiRappelRevenus = (reponse: NotificationResponse) => {
      // Toujours vers l'accueil (liste des comptes), quel que soit le
      // nombre de comptes de l'utilisateur — décision ticket #14 : pas de
      // compte « pertinent » à deviner côté notification, chaque compte
      // étant géré de façon totalement indépendante (voir CLAUDE.md).
      if (reponse.notification.request.identifier === IDENTIFIANT_RAPPEL_REVENUS) {
        router.replace('/');
      }
    };

    // Cold start : l'app a été lancée par le tap sur la notification, la
    // réponse n'a donc pas encore été reçue par un listener (pas encore
    // monté au moment du tap) — il faut aller la chercher explicitement.
    // `getLastNotificationResponseAsync` ne s'auto-efface pas : sans
    // `clearLastNotificationResponseAsync` explicite ensuite, la même
    // réponse serait revue (et reforcerait la navigation vers l'accueil) à
    // chaque lancement futur de l'app, y compris des lancements normaux
    // sans rapport avec une notification.
    Notifications.getLastNotificationResponseAsync()
      .then((reponse) => {
        if (reponse) {
          ouvrirAccueilSiRappelRevenus(reponse);
          Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch((error: unknown) => {
        // Best-effort, comme le reste du code de notifications de ce
        // projet (voir rappel-revenus.ts/notifications-permission.ts) :
        // une erreur ici ne doit pas rester une rejection non gérée.
        console.warn('Échec de la lecture de la dernière notification :', error);
      });

    // App déjà ouverte (premier ou arrière-plan) au moment du tap.
    const abonnement = Notifications.addNotificationResponseReceivedListener(
      ouvrirAccueilSiRappelRevenus,
    );

    return () => {
      abonnement.remove();
    };
  }, [router]);

  if (migrationsError) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ThemedText type="subtitle">Erreur de mise à jour de la base de données</ThemedText>
        <ThemedText>{migrationsError.message}</ThemedText>
      </ThemedView>
    );
  }

  // Le splash natif reste affiché (preventAutoHideAsync) tant que les
  // migrations ne sont pas terminées.
  if (!migrationsReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Montée une fois ici plutôt que par écran : pilotée par
          useConfirmationSuppressionStore, déclenchée depuis n'importe quel
          écran via demanderConfirmationSuppression (ticket #45). */}
      <ConfirmationSuppressionPopup />
    </ThemeProvider>
  );
}
