import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ConfirmationSuppressionPopup } from '@/components/confirmation-suppression-popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/db/client';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success: migrationsReady, error: migrationsError } = useMigrations(db, migrations);

  useEffect(() => {
    if (migrationsError) {
      // AnimatedSplashOverlay (seul appelant de hideAsync() du projet) n'est
      // jamais monté sur cette branche : sans cet appel explicite, le splash
      // natif resterait affiché indéfiniment par-dessus le message d'erreur.
      SplashScreen.hideAsync();
    }
  }, [migrationsError]);

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
