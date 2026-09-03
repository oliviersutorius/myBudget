import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PopupOverlayColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

/**
 * Popup de confirmation avant une suppression, montée une fois à la racine
 * (src/app/_layout.tsx) et pilotée par `useConfirmationSuppressionStore` —
 * déclenchée par `demanderConfirmationSuppression`
 * (src/components/actions-menu-button.tsx). Remplace l'ancien `Alert.alert`
 * natif : tranche le point laissé ouvert par le ticket #45 en faveur d'une
 * popup maison cohérente avec le reste de l'app (voile, carte, tokens
 * Sauge), l'action « Supprimer » mise en évidence en `danger`. Le menu
 * d'actions « ⋮ » lui-même (Modifier/Supprimer/…) reste natif pour
 * l'instant — portée distincte du même ticket.
 */
export function ConfirmationSuppressionPopup() {
  const theme = useTheme();
  // `visible` dérivé de `onConfirmer` (pas de booléen séparé dans le store,
  // voir son commentaire) : la popup est visible tant qu'un callback est en
  // attente.
  const { titre, message, onConfirmer, fermer, confirmer } = useConfirmationSuppressionStore();
  const visible = onConfirmer !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la popup"
        style={[styles.overlay, { backgroundColor: PopupOverlayColor }]}
        onPress={fermer}
      >
        {/* onPress no-op : absorbe le tap pour ne pas fermer la popup quand on
            touche la carte elle-même — même garde que AjoutPopup. */}
        <Pressable
          testID="confirmation-suppression-popup-card"
          style={[styles.card, { backgroundColor: theme.background }]}
          onPress={() => {}}
        >
          <ThemedText type="smallBold">{titre}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {message}
          </ThemedText>

          <ThemedView style={styles.footer}>
            <Pressable accessibilityRole="button" accessibilityLabel="Annuler" onPress={fermer}>
              <ThemedText type="link">Annuler</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Supprimer"
              onPress={confirmer}
            >
              <ThemedText type="link" themeColor="danger">
                Supprimer
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.four,
  },
});
