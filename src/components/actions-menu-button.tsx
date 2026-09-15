import { Fragment, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KebabIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PopupOverlayColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

// Extrait de `comptes/[id]/edit.tsx` (ticket #41) à l'occasion du ticket #16
// (suppression d'un compte, page d'accueil) : la page d'accueil est le
// « deuxième écran de liste » annoncé par le commentaire d'origine comme
// condition à cette extraction — voir le comparatif avec `src/app/**`
// (exclu de la couverture Jest) ci-dessous. La page d'accueil n'utilise plus
// ce composant depuis le ticket #67 (menu « ⋮ » retiré des lignes de
// compte) ; restent l'onglet Dépenses (types niveau 2/niveau 3) et l'onglet
// Revenus.
export type ActionMenuItem = { label: string; onPress: () => void; destructive?: boolean };

/**
 * Popup de confirmation partagée par les suppressions de l'application (type
 * de dépense niveau 2, niveau 3, revenu, compte) : même forme Annuler/
 * Supprimer partout, déclenchée depuis l'entrée « Supprimer » d'un
 * `ActionsMenuButton`.
 *
 * Délègue à `useConfirmationSuppressionStore` plutôt que d'ouvrir un
 * `Alert.alert` natif : la popup elle-même (`ConfirmationSuppressionPopup`,
 * montée une fois à la racine dans `src/app/_layout.tsx`) est un composant
 * maison cohérent avec le reste de la charte graphique (voile, carte,
 * tokens Sauge) — tranche le point laissé ouvert par le ticket #45.
 */
export function demanderConfirmationSuppression(
  titre: string,
  message: string,
  onConfirmer: () => void,
) {
  useConfirmationSuppressionStore.getState().demander(titre, message, onConfirmer);
}

/**
 * Bouton « ⋮ » ouvrant un menu d'actions (Modifier/Supprimer, etc.) — action-
 * sheet maison ancré en bas d'écran (ticket #66, déclinaison B validée sur
 * canvas : la plus proche du `Alert.alert` natif qu'elle remplace, voile +
 * carte d'actions + « Annuler » en carte séparée en dessous), plutôt que le
 * menu natif de l'OS utilisé jusqu'ici — non stylable, incohérent avec le
 * reste de la charte graphique (point explicitement laissé ouvert par le
 * ticket #45). État d'ouverture local (`useState`) : contrairement à
 * `ConfirmationSuppressionPopup`, ce menu est toujours déclenché depuis son
 * propre bouton (jamais depuis un point d'entrée impératif ailleurs dans le
 * code), pas besoin d'un store partagé.
 *
 * Pattern établi par `RevenuRow` (ticket #12) et généralisé à toutes les
 * listes de l'onglet Dépenses par la charte graphique (ticket #26).
 */
export function ActionsMenuButton({
  accessibilityLabel,
  title,
  message,
  disabled,
  actions,
}: {
  accessibilityLabel: string;
  title: string;
  message?: string;
  disabled?: boolean;
  actions: ActionMenuItem[];
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [ouvert, setOuvert] = useState(false);

  const fermer = () => setOuvert(false);

  const choisir = (action: ActionMenuItem) => {
    // Referme avant d'exécuter l'action (pas après) : même choix que
    // `useConfirmationSuppressionStore.confirmer` — une action qui
    // déclencherait elle-même un état affectant ce composant (ex. `disabled`
    // passant à `true` pendant une suppression) ne doit pas se retrouver à
    // rouvrir ou laisser ouvert un menu déjà obsolète.
    fermer();
    action.onPress();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={() => setOuvert(true)}
        style={styles.actionsMenuButton}
      >
        <KebabIcon color={theme.text} />
      </Pressable>

      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={fermer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le menu"
          style={[styles.overlay, { backgroundColor: PopupOverlayColor }]}
          onPress={fermer}
        >
          {/* onPress no-op : absorbe le tap pour ne pas fermer le menu quand
              on touche la carte elle-même — même garde que AjoutPopup/
              ConfirmationSuppressionPopup. */}
          <Pressable
            testID="actions-menu-sheet"
            style={[styles.sheet, { paddingBottom: Spacing.two + insets.bottom }]}
            onPress={() => {}}
          >
            <ThemedView style={[styles.card, { backgroundColor: theme.background }]}>
              <ThemedView style={styles.cardHeader}>
                <ThemedText type="smallBold">{title}</ThemedText>
                {message ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {message}
                  </ThemedText>
                ) : null}
              </ThemedView>
              <ThemedView style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

              {actions.map((action, index) => (
                <Fragment key={action.label}>
                  {index > 0 ? (
                    <ThemedView
                      style={[styles.divider, { backgroundColor: theme.backgroundSelected }]}
                    />
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    onPress={() => choisir(action)}
                    style={styles.actionRow}
                  >
                    <ThemedText themeColor={action.destructive ? 'danger' : 'text'}>
                      {action.label}
                    </ThemedText>
                  </Pressable>
                </Fragment>
              ))}
            </ThemedView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              onPress={fermer}
              style={[styles.card, styles.cancelCard, { backgroundColor: theme.background }]}
            >
              <ThemedText>Annuler</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actionsMenuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  divider: {
    height: 1,
  },
  actionRow: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  cancelCard: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
