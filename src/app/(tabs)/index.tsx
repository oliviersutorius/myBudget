import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getComptesQuery } from '@/db/queries/get-comptes';

type Compte = Awaited<ReturnType<typeof getComptesQuery>>[number];

export default function AccueilScreen() {
  const router = useRouter();
  const { data: comptes } = useLiveQuery(getComptesQuery());
  const aucunCompte = comptes.length === 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Mes comptes
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter un compte"
            onPress={() => router.push('/comptes/create')}
          >
            <ThemedView type="backgroundElement" style={styles.addButton}>
              <ThemedText type="title" style={styles.addButtonLabel}>
                +
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {aucunCompte ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyStateTitle}>
              Aucun compte pour l&apos;instant
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyStateText}>
              Ajoutez un compte bancaire pour commencer à suivre votre budget.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={comptes}
            keyExtractor={(compte) => String(compte.id)}
            renderItem={({ item: compte }) => <CompteRow compte={compte} />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// Ligne de la liste des comptes : toute la ligne ouvre la page du compte
// (sur l'onglet Budget, onglet par défaut de EditionCompteScreen), plus de
// menu « ⋮ » Modifier/Supprimer (ticket #67) — « Modifier » n'avait plus de
// raison d'être distinct du tap sur la ligne une fois la suppression
// déplacée dans l'onglet Infos de la page compte (voir son commentaire).
function CompteRow({ compte }: { compte: Compte }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir le compte ${compte.nom}`}
      onPress={() =>
        router.push({ pathname: '/comptes/[id]/edit', params: { id: String(compte.id) } })
      }
    >
      {/* `type="backgroundElement"` explicite : `ThemedView` retombe sinon
          sur son fond par défaut (`background`, voir themed-view.tsx),
          visuellement distinct de `compteRow` — même défaut que celui
          corrigé côté onglets Dépenses/Budget de la page compte (ticket
          #64), repéré ici en passant au même endroit du code. */}
      <ThemedView type="backgroundElement" style={styles.compteRow}>
        <ThemedView type="backgroundElement" style={styles.compteInfo}>
          <ThemedText type="smallBold">{compte.nom}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {compte.banque}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
  },
  title: {
    paddingTop: 0,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLabel: {
    fontSize: 24,
    lineHeight: 28,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    // La tab bar native (NativeTabs) survole le contenu au lieu de réserver
    // de la place dans le layout : sans cet inset, les dernières lignes se
    // retrouvent cachées dessous.
    paddingBottom: BottomTabInset + Spacing.four,
  },
  compteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  compteInfo: {
    gap: Spacing.half,
  },
});
