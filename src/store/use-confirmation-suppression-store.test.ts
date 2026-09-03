import { useConfirmationSuppressionStore } from './use-confirmation-suppression-store';

describe('useConfirmationSuppressionStore', () => {
  beforeEach(() => {
    useConfirmationSuppressionStore.setState({
      visible: false,
      titre: '',
      message: '',
      onConfirmer: null,
    });
  });

  it("n'est pas visible par défaut", () => {
    expect(useConfirmationSuppressionStore.getState().visible).toBe(false);
  });

  it('ouvre la popup avec le titre, le message et le callback fournis', () => {
    const onConfirmer = jest.fn();

    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.visible).toBe(true);
    expect(etat.titre).toBe('Titre');
    expect(etat.message).toBe('Message');
    expect(etat.onConfirmer).toBe(onConfirmer);
  });

  it('ferme la popup et oublie le callback en attente', () => {
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', jest.fn());

    useConfirmationSuppressionStore.getState().fermer();

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.visible).toBe(false);
    expect(etat.onConfirmer).toBeNull();
  });

  it('une nouvelle demande remplace la précédente (jamais deux popups en attente)', () => {
    useConfirmationSuppressionStore.getState().demander('Premier', 'Message 1', jest.fn());
    useConfirmationSuppressionStore.getState().demander('Second', 'Message 2', jest.fn());

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.titre).toBe('Second');
    expect(etat.message).toBe('Message 2');
  });
});
