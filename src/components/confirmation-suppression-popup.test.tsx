import { fireEvent, render } from '@testing-library/react-native';

import { ConfirmationSuppressionPopup } from '@/components/confirmation-suppression-popup';
import { useConfirmationSuppressionStore } from '@/store/use-confirmation-suppression-store';

describe('ConfirmationSuppressionPopup', () => {
  beforeEach(() => {
    useConfirmationSuppressionStore.setState({
      visible: false,
      titre: '',
      message: '',
      onConfirmer: null,
    });
  });

  it('affiche le titre et le message de la demande en cours', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore
      .getState()
      .demander(
        'Supprimer ce compte ?',
        '« Compte courant » sera définitivement supprimé.',
        onConfirmer,
      );

    const { getByText } = render(<ConfirmationSuppressionPopup />);

    expect(getByText('Supprimer ce compte ?')).toBeTruthy();
    expect(getByText('« Compte courant » sera définitivement supprimé.')).toBeTruthy();
  });

  it('« Supprimer » déclenche le callback et referme la popup', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    const { getByLabelText } = render(<ConfirmationSuppressionPopup />);
    fireEvent.press(getByLabelText('Supprimer'));

    expect(onConfirmer).toHaveBeenCalledTimes(1);
    expect(useConfirmationSuppressionStore.getState().visible).toBe(false);
  });

  it('« Annuler » referme la popup sans déclencher le callback', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    const { getByLabelText } = render(<ConfirmationSuppressionPopup />);
    fireEvent.press(getByLabelText('Annuler'));

    expect(onConfirmer).not.toHaveBeenCalled();
    expect(useConfirmationSuppressionStore.getState().visible).toBe(false);
  });

  it('un tap sur le voile referme la popup sans déclencher le callback', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    const { getByLabelText } = render(<ConfirmationSuppressionPopup />);
    fireEvent.press(getByLabelText('Fermer la popup'));

    expect(onConfirmer).not.toHaveBeenCalled();
    expect(useConfirmationSuppressionStore.getState().visible).toBe(false);
  });

  it('un tap sur la carte ne referme pas la popup (absorbe le tap avant le voile)', () => {
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', jest.fn());

    const { getByTestId } = render(<ConfirmationSuppressionPopup />);
    fireEvent.press(getByTestId('confirmation-suppression-popup-card'));

    expect(useConfirmationSuppressionStore.getState().visible).toBe(true);
  });
});
