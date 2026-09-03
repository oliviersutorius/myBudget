import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

// Voile dérivé du token `text` (light) à 50% d'opacité, indépendant du thème
// actif — même dérivation que `AjoutPopup` (comptes/[id]/edit.tsx, ticket
// #41), copiée ici plutôt que partagée : `AjoutPopup` prend des champs de
// formulaire en enfants (cas ajout/édition), cette popup n'affiche qu'un
// titre et un message (cas confirmation) — les factoriser demanderait de
// généraliser AjoutPopup pour un seul autre appelant, pas fait ici.
const POPUP_OVERLAY_COLOR = `${Colors.light.text}80`;

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
  const { visible, titre, message, onConfirmer, fermer } = useConfirmationSuppressionStore();

  const confirmer = () => {
    fermer();
    onConfirmer?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fermer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la popup"
        style={[styles.overlay, { backgroundColor: POPUP_OVERLAY_COLOR }]}
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
