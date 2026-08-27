import { create } from 'zustand';

interface CompteActifState {
  compteActifId: number | null;
  definirCompteActif: (compteId: number | null) => void;
}

// État partagé entre écrans (édition de compte, récapitulatif mensuel) : le
// compte actuellement sélectionné/consulté. Un compte n'est jamais agrégé
// avec un autre (voir docs/DOMAIN.md) : ce store ne retient qu'un seul
// compte actif à la fois, jamais une sélection multiple.
export const useCompteActifStore = create<CompteActifState>((set) => ({
  compteActifId: null,
  definirCompteActif: (compteId) => set({ compteActifId: compteId }),
}));
