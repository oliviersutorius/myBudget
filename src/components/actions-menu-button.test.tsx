import { fireEvent, render } from '@testing-library/react-native';
import { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  ActionsMenuButton,
  demanderConfirmationSuppression,
} from '@/components/actions-menu-button';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

// `ActionsMenuButton` lit `useSafeAreaInsets` (marge basse du menu, ticket
// #66) : fourni en production par le `SafeAreaProvider` monté par
// expo-router à la racine (`ExpoRoot`), absent de l'arbre de test — sans ce
// wrapper, le hook lève (« No safe area value available »). `initialMetrics`
// évite de dépendre d'un événement `onLayout` natif, jamais déclenché ici.
function renderMenu(ui: ReactElement) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        frame: { x: 0, y: 0, width: 390, height: 844 },
      }}
    >
      {ui}
    </SafeAreaProvider>,
  );
}

describe('demanderConfirmationSuppression', () => {
  beforeEach(() => {
    useConfirmationSuppressionStore.setState({ titre: '', message: '', onConfirmer: null });
  });

  it('ouvre useConfirmationSuppressionStore avec le titre, le message et le callback fournis', () => {
    // Popup maison (ConfirmationSuppressionPopup) plutôt qu'un Alert.alert
    // natif depuis le ticket #45 (voir le commentaire de la fonction) : ce
    // test vérifie l'appel au store, le rendu de la popup elle-même étant
    // couvert par confirmation-suppression-popup.test.tsx.
    const onConfirmer = jest.fn();

    demanderConfirmationSuppression('Titre', 'Message', onConfirmer);

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.titre).toBe('Titre');
    expect(etat.message).toBe('Message');
    expect(etat.onConfirmer).toBe(onConfirmer);
  });
});

describe('ActionsMenuButton', () => {
  it('le menu est fermé initialement', () => {
    const { queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        actions={[{ label: 'Modifier', onPress: jest.fn() }]}
      />,
    );

    expect(queryByText('Compte courant')).toBeNull();
    expect(queryByText('Modifier')).toBeNull();
  });

  it('ouvre le menu au clic, affiche le titre/message et déclenche l’action choisie', () => {
    const onModifier = jest.fn();
    const onSupprimer = jest.fn();

    const { getByLabelText, getByText, queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le revenu Salaire"
        title="Salaire"
        message="2 000,00 €"
        actions={[
          { label: 'Modifier', onPress: onModifier },
          { label: 'Supprimer', onPress: onSupprimer, destructive: true },
        ]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le revenu Salaire'));

    expect(getByText('Salaire')).toBeTruthy();
    expect(getByText('2 000,00 €')).toBeTruthy();

    fireEvent.press(getByLabelText('Supprimer'));

    expect(onSupprimer).toHaveBeenCalledTimes(1);
    expect(onModifier).not.toHaveBeenCalled();
    // Le menu se referme après le choix d'une action (le titre, affiché
    // uniquement dans la carte du menu, disparaît).
    expect(queryByText('Salaire')).toBeNull();
  });

  it('ne déclenche pas l’ouverture du menu quand le bouton est désactivé', () => {
    const { getByLabelText, queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        disabled
        actions={[{ label: 'Supprimer', onPress: jest.fn(), destructive: true }]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));

    expect(queryByText('Compte courant')).toBeNull();
  });

  it('un tap sur le voile referme le menu sans déclencher d’action', () => {
    const onSupprimer = jest.fn();

    const { getByLabelText, queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        actions={[{ label: 'Supprimer', onPress: onSupprimer, destructive: true }]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));
    expect(queryByText('Compte courant')).toBeTruthy();

    fireEvent.press(getByLabelText('Fermer le menu'));

    expect(onSupprimer).not.toHaveBeenCalled();
    expect(queryByText('Compte courant')).toBeNull();
  });

  it('« Annuler » referme le menu sans déclencher d’action', () => {
    const onSupprimer = jest.fn();

    const { getByLabelText, queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        actions={[{ label: 'Supprimer', onPress: onSupprimer, destructive: true }]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));
    fireEvent.press(getByLabelText('Annuler'));

    expect(onSupprimer).not.toHaveBeenCalled();
    expect(queryByText('Compte courant')).toBeNull();
  });

  it('un tap sur la carte d’actions ne referme pas le menu (absorbe le tap avant le voile)', () => {
    const { getByLabelText, getByTestId, queryByText } = renderMenu(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        actions={[{ label: 'Supprimer', onPress: jest.fn(), destructive: true }]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));
    fireEvent.press(getByTestId('actions-menu-sheet'));

    expect(queryByText('Compte courant')).toBeTruthy();
  });
});
