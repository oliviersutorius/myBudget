import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActionsMenuButton,
  demanderConfirmationSuppression,
} from '@/components/actions-menu-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { deleteCompte } from '@/db/queries/delete-compte';
import { getComptesQuery } from '@/db/queries/get-comptes';
import { estErreurContrainteForeignKey } from '@/utils/erreurs-sqlite';

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
            renderItem={({ item: compte }) => (
              <CompteRow
                compte={compte}
                onModifier={() =>
                  router.push({
                    pathname: '/comptes/[id]/edit',
                    params: { id: String(compte.id) },
                  })
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// Ligne de la liste des comptes : menu « ⋮ » Modifier/Supprimer (ticket
// #16), même pattern que RevenuRow (ticket #12) — ActionsMenuButton a été
// extrait dans src/components/ à cette occasion, la liste des comptes étant
// le deuxième écran de liste à en avoir besoin (voir son commentaire
// d'origine dans comptes/[id]/edit.tsx).
function CompteRow({ compte, onModifier }: { compte: Compte; onModifier: () => void }) {
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Même garde-fou que RevenuRow : évite un setState après démontage si la
  // ligne disparaît (suppression réussie) pendant que ce composant traite
  // encore l'échec d'un appel concurrent.
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  const supprimer = async () => {
    setErreur(null);
    setSuppression(true);
    try {
      await deleteCompte(compte.id);
    } catch (error) {
      if (!monte.current) {
        return;
      }
      // Contrainte de clé étrangère (PRAGMA foreign_keys = ON) : la
      // suppression échoue tant que des types de dépense ou des revenus
      // dépendent encore de ce compte (voir delete-compte.ts) — implémente
      // la règle "suppression bloquée si historique existant"
      // (docs/DOMAIN.md § invariants ; approximation "présence de lignes
      // dépendantes" plutôt que "historique sur un mois passé" au sens
      // strict, voir le commentaire de delete-compte.ts).
      setErreur(
        estErreurContrainteForeignKey(error)
          ? 'Suppression impossible : des dépenses ou revenus sont encore rattachés à ce compte.'
          : 'La suppression a échoué, réessayez.',
      );
      setSuppression(false);
    }
  };

  const confirmerSuppression = () => {
    demanderConfirmationSuppression(
      'Supprimer ce compte ?',
      `« ${compte.nom} » sera définitivement supprimé.`,
      supprimer,
    );
  };

  return (
    <ThemedView type="backgroundElement" style={styles.compteRow}>
      <ThemedView style={styles.compteInfo}>
        <ThemedText type="smallBold">{compte.nom}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {compte.banque}
        </ThemedText>
        {erreur ? (
          <ThemedText type="small" themeColor="danger">
            {erreur}
          </ThemedText>
        ) : null}
      </ThemedView>

      <ActionsMenuButton
        accessibilityLabel={`Actions pour le compte ${compte.nom} (#${compte.id})`}
        title={compte.nom}
        disabled={suppression}
        actions={[
          { label: 'Modifier', onPress: onModifier },
          { label: 'Supprimer', onPress: confirmerSuppression, destructive: true },
        ]}
      />
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
    // de la place dans le layout : sans cet inset, les dernières lignes
    // (et leur bouton "⋮") se retrouvent cachées dessous.
    paddingBottom: BottomTabInset + Spacing.four,
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
