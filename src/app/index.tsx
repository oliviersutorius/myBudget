import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getComptesQuery } from '@/db/queries/get-comptes';

export default function AccueilScreen() {
  const router = useRouter();
  const { data: comptes } = useLiveQuery(getComptesQuery());

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Mes comptes
        </ThemedText>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={comptes}
          keyExtractor={(compte) => String(compte.id)}
          renderItem={({ item: compte }) => (
            <ThemedView type="backgroundElement" style={styles.compteRow}>
              <ThemedView style={styles.compteInfo}>
                <ThemedText type="smallBold">{compte.nom}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {compte.banque}
                </ThemedText>
              </ThemedView>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Modifier le compte ${compte.nom}`}
                onPress={() =>
                  router.push({ pathname: '/comptes/[id]/edit', params: { id: String(compte.id) } })
                }
              >
                <ThemedText type="link">Modifier</ThemedText>
              </Pressable>
            </ThemedView>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    paddingTop: Spacing.three,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  compteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  compteInfo: {
    gap: Spacing.half,
  },
});
