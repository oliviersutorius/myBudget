import { useConfirmationSuppressionStore } from './use-confirmation-suppression-store';

describe('useConfirmationSuppressionStore', () => {
  beforeEach(() => {
    useConfirmationSuppressionStore.setState({ titre: '', message: '', onConfirmer: null });
  });

  it("n'a aucun callback en attente par défaut (popup fermée)", () => {
    expect(useConfirmationSuppressionStore.getState().onConfirmer).toBeNull();
  });

  it('ouvre la popup avec le titre, le message et le callback fournis', () => {
    const onConfirmer = jest.fn();

    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.titre).toBe('Titre');
    expect(etat.message).toBe('Message');
    expect(etat.onConfirmer).toBe(onConfirmer);
  });

  it('fermer() oublie le callback en attente sans le déclencher', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    useConfirmationSuppressionStore.getState().fermer();

    expect(useConfirmationSuppressionStore.getState().onConfirmer).toBeNull();
    expect(onConfirmer).not.toHaveBeenCalled();
  });

  it('confirmer() déclenche le callback en attente puis referme', () => {
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    useConfirmationSuppressionStore.getState().confirmer();

    expect(onConfirmer).toHaveBeenCalledTimes(1);
    expect(useConfirmationSuppressionStore.getState().onConfirmer).toBeNull();
  });

  it('confirmer() appelé deux fois ne déclenche le callback qu’une seule fois (double-tap)', () => {
    // Le callback est capturé puis effacé en une seule mise à jour d'état
    // (voir le commentaire de `confirmer` dans le store) : un second appel
    // avant re-rendu du composant trouve `onConfirmer` déjà à `null`.
    const onConfirmer = jest.fn();
    useConfirmationSuppressionStore.getState().demander('Titre', 'Message', onConfirmer);

    useConfirmationSuppressionStore.getState().confirmer();
    useConfirmationSuppressionStore.getState().confirmer();

    expect(onConfirmer).toHaveBeenCalledTimes(1);
  });

  it('une nouvelle demande remplace la précédente (jamais deux popups en attente)', () => {
    useConfirmationSuppressionStore.getState().demander('Premier', 'Message 1', jest.fn());
    useConfirmationSuppressionStore.getState().demander('Second', 'Message 2', jest.fn());

    const etat = useConfirmationSuppressionStore.getState();
    expect(etat.titre).toBe('Second');
    expect(etat.message).toBe('Message 2');
  });
});
