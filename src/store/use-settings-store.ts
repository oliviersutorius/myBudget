import { create } from 'zustand';

export type Currency = 'EUR' | 'USD' | 'GBP';

interface SettingsState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

// Exemple de store Zustand partagé entre écrans (préférences utilisateur).
// Voir /new-feature pour le scaffold d'un nouveau store lié à une feature.
export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'EUR',
  setCurrency: (currency) => set({ currency }),
}));
