import { Alert, Pressable, StyleSheet } from 'react-native';

import { KebabIcon } from '@/components/icons';
import { useTheme } from '@/hooks/use-theme';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

// Extrait de `comptes/[id]/edit.tsx` (ticket #41) à l'occasion du ticket #16
// (suppression d'un compte, page d'accueil) : la page d'accueil est le
// « deuxième écran de liste » annoncé par le commentaire d'origine comme
// condition à cette extraction — voir le comparatif avec `src/app/**`
// (exclu de la couverture Jest) ci-dessous.
export type ActionMenuItem = { label: string; onPress: () => void; destructive?: boolean };

/**
 * Construit la liste de boutons d'un `Alert.alert` : « Annuler » toujours en
 * tête, puis les actions demandées. Partagé par `demanderConfirmationSuppression`
 * et `ActionsMenuButton`, qui sont chacun une variante (1 action destructive
 * fixe / N actions arbitraires) du même `Alert.alert`.
 */
export function alertActions(actions: ActionMenuItem[]) {
  return [
    { text: 'Annuler', style: 'cancel' as const },
    ...actions.map(({ label, onPress, destructive }) => ({
      text: label,
      style: destructive ? ('destructive' as const) : undefined,
      onPress,
    })),
  ];
}

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
 * tokens Sauge) — tranche le point laissé ouvert par le ticket #45. Le menu
 * d'actions natif ci-dessous (`ActionsMenuButton`) n'est pas concerné,
 * portée distincte du même ticket.
 */
export function demanderConfirmationSuppression(
  titre: string,
  message: string,
  onConfirmer: () => void,
) {
  useConfirmationSuppressionStore.getState().demander(titre, message, onConfirmer);
}

/**
 * Bouton « ⋮ » ouvrant un menu natif d'actions (Modifier/Supprimer, etc.) —
 * pattern établi par `RevenuRow` (ticket #12) et généralisé à toutes les
 * listes de l'onglet Dépenses par la charte graphique (ticket #26), puis à
 * la liste des comptes par le ticket #16.
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

  const ouvrirActions = () => {
    Alert.alert(title, message, alertActions(actions));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={ouvrirActions}
      style={styles.actionsMenuButton}
    >
      <KebabIcon color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionsMenuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
