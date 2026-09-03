import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  ActionsMenuButton,
  alertActions,
  demanderConfirmationSuppression,
} from '@/components/actions-menu-button';

describe('alertActions', () => {
  it('place « Annuler » en tête, suivi des actions demandées', () => {
    const onPress = jest.fn();

    expect(alertActions([{ label: 'Modifier', onPress }])).toEqual([
      { text: 'Annuler', style: 'cancel' },
      { text: 'Modifier', style: undefined, onPress },
    ]);
  });

  it('applique le style « destructive » aux actions marquées comme telles', () => {
    const onPress = jest.fn();

    const boutons = alertActions([{ label: 'Supprimer', onPress, destructive: true }]);

    expect(boutons[1]).toMatchObject({ text: 'Supprimer', style: 'destructive' });
  });
});

describe('demanderConfirmationSuppression', () => {
  it('ouvre une confirmation Annuler/Supprimer et déclenche le callback au clic sur Supprimer', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onConfirmer = jest.fn();

    demanderConfirmationSuppression('Titre', 'Message', onConfirmer);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [titre, message, boutons] = alertSpy.mock.calls[0];
    expect(titre).toBe('Titre');
    expect(message).toBe('Message');
    expect(boutons?.map((bouton) => bouton.text)).toEqual(['Annuler', 'Supprimer']);

    boutons?.[1].onPress?.();
    expect(onConfirmer).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });
});

describe('ActionsMenuButton', () => {
  it('ouvre le menu au clic et déclenche l’action choisie', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onModifier = jest.fn();
    const onSupprimer = jest.fn();

    const { getByLabelText } = render(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        actions={[
          { label: 'Modifier', onPress: onModifier },
          { label: 'Supprimer', onPress: onSupprimer, destructive: true },
        ]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [titre, message, boutons] = alertSpy.mock.calls[0];
    expect(titre).toBe('Compte courant');
    expect(message).toBeUndefined();
    expect(boutons?.map((bouton) => bouton.text)).toEqual(['Annuler', 'Modifier', 'Supprimer']);

    boutons?.[2].onPress?.();
    expect(onSupprimer).toHaveBeenCalledTimes(1);
    expect(onModifier).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('ne déclenche pas le menu quand le bouton est désactivé', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByLabelText } = render(
      <ActionsMenuButton
        accessibilityLabel="Actions pour le compte Compte courant"
        title="Compte courant"
        disabled
        actions={[{ label: 'Supprimer', onPress: jest.fn(), destructive: true }]}
      />,
    );

    fireEvent.press(getByLabelText('Actions pour le compte Compte courant'));

    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
