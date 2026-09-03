import { create } from 'zustand';

interface ConfirmationSuppressionState {
  visible: boolean;
  titre: string;
  message: string;
  onConfirmer: (() => void) | null;
  demander: (titre: string, message: string, onConfirmer: () => void) => void;
  fermer: () => void;
}

// État partagé entre écrans (page d'accueil, page compte) : une seule popup
// de confirmation de suppression montée une fois à la racine (voir
// ConfirmationSuppressionPopup, montée dans src/app/_layout.tsx) plutôt
// qu'un `useState` local par écran. Permet à `demanderConfirmationSuppression`
// (src/components/actions-menu-button.tsx) de garder une API impérative
// simple — un appel de fonction, sans que chaque écran appelant ait à gérer
// sa propre popup — même esprit que `useCompteActifStore`.
export const useConfirmationSuppressionStore = create<ConfirmationSuppressionState>((set) => ({
  visible: false,
  titre: '',
  message: '',
  onConfirmer: null,
  demander: (titre, message, onConfirmer) => set({ visible: true, titre, message, onConfirmer }),
  fermer: () => set({ visible: false, onConfirmer: null }),
}));
