import { useCompteActifStore } from './use-compte-actif-store';

describe('useCompteActifStore', () => {
  beforeEach(() => {
    useCompteActifStore.setState({ compteActifId: null });
  });

  it("n'a aucun compte actif par défaut", () => {
    expect(useCompteActifStore.getState().compteActifId).toBeNull();
  });

  it('définit le compte actif sélectionné', () => {
    useCompteActifStore.getState().definirCompteActif(42);

    expect(useCompteActifStore.getState().compteActifId).toBe(42);
  });

  it('permet de revenir à aucun compte actif', () => {
    useCompteActifStore.getState().definirCompteActif(1);
    useCompteActifStore.getState().definirCompteActif(null);

    expect(useCompteActifStore.getState().compteActifId).toBeNull();
  });

  it('remplace le compte actif précédent par le nouveau (jamais de sélection multiple)', () => {
    useCompteActifStore.getState().definirCompteActif(1);
    useCompteActifStore.getState().definirCompteActif(2);

    expect(useCompteActifStore.getState().compteActifId).toBe(2);
  });

  it('conserve la sélection à travers plusieurs lectures (persistance pendant la session)', () => {
    useCompteActifStore.getState().definirCompteActif(7);

    expect(useCompteActifStore.getState().compteActifId).toBe(7);
    expect(useCompteActifStore.getState().compteActifId).toBe(7);
  });
});
