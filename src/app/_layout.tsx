import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ConfirmationSuppressionPopup } from '@/components/confirmation-suppression-popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/db/client';
import { IDENTIFIANT_RAPPEL_REVENUS, programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

// Sans handler explicite, une notification qui se déclencherait pendant que
// l'app est déjà au premier plan (ex. laissée ouverte jusqu'après minuit le
// 1er du mois, ticket #14) ne s'afficherait pas du tout — comportement par
// défaut d'expo-notifications, qui viderait le rappel de son intérêt dans ce
// cas précis. Appelé une seule fois au chargement du module, avant même le
// montage de RootLayout.
Notifications.setNotificationHandler({
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
    // Toujours vers l'accueil (liste des comptes), quel que soit le nombre
    // de comptes de l'utilisateur — décision ticket #14 : pas de compte
    // « pertinent » à deviner côté notification, chaque compte étant géré
    // de façon totalement indépendante (voir CLAUDE.md).
    const ouvrirAccueilSiRappelRevenus = (reponse: Notifications.NotificationResponse) => {
      if (reponse.notification.request.identifier === IDENTIFIANT_RAPPEL_REVENUS) {
        router.replace('/');
      }
    };

    // Cold start : l'app a été lancée par le tap sur la notification, la
    // réponse n'a donc pas encore été reçue par un listener (pas encore
    // monté au moment du tap) — il faut aller la chercher explicitement.
    Notifications.getLastNotificationResponseAsync().then((reponse) => {
      if (reponse) {
        ouvrirAccueilSiRappelRevenus(reponse);
      }
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
