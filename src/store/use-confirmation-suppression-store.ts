import { create } from 'zustand';

interface ConfirmationSuppressionState {
  titre: string;
  message: string;
  // Popup visible <=> callback en attente : pas de booléen `visible` séparé
  // (serait redondant, et risquerait de désynchroniser les deux si un futur
  // appel ne mettait à jour que l'un des deux champs — voir review PR #48).
  onConfirmer: (() => void) | null;
  demander: (titre: string, message: string, onConfirmer: () => void) => void;
  fermer: () => void;
  /**
   * Ferme la popup et déclenche le callback en attente, dans cet ordre et en
   * une seule mise à jour d'état : capture `onConfirmer` avant de le remettre
   * à `null`, pour qu'un second appel (double-tap rapide sur « Supprimer »,
   * avant que le composant n'ait re-rendu avec le nouvel état) trouve le
   * callback déjà consommé plutôt que de le redéclencher — voir review PR #48.
   */
  confirmer: () => void;
}

// État partagé entre écrans (page d'accueil, page compte) : une seule popup
// de confirmation de suppression montée une fois à la racine (voir
// ConfirmationSuppressionPopup, montée dans src/app/_layout.tsx) plutôt
// qu'un `useState` local par écran. Permet à `demanderConfirmationSuppression`
// (src/components/actions-menu-button.tsx) de garder une API impérative
// simple — un appel de fonction, sans que chaque écran appelant ait à gérer
// sa propre popup — même esprit que `useCompteActifStore`.
export const useConfirmationSuppressionStore = create<ConfirmationSuppressionState>((set, get) => ({
  titre: '',
  message: '',
  onConfirmer: null,
  demander: (titre, message, onConfirmer) => set({ titre, message, onConfirmer }),
  fermer: () => set({ onConfirmer: null }),
  confirmer: () => {
    const { onConfirmer } = get();
    set({ onConfirmer: null });
    onConfirmer?.();
  },
}));
