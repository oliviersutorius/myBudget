import { parseMontantEnCentimes } from '@/utils/montant';

export interface RevenuFormValues {
  libelle: string;
  montant: string;
}

export interface RevenuFormErrors {
  libelle?: string;
  montant?: string;
}

// Validation pure du formulaire d'ajout de revenu (ticket #12) : libellé et
// montant sont obligatoires, le montant doit être un nombre strictement
// positif (un revenu ne peut pas être nul ou négatif — voir
// src/utils/montant.ts). Extraite de l'écran pour être testable
// unitairement (src/app/** est exclu de la couverture, voir jest.config.js).
export function validateRevenuForm(values: RevenuFormValues): RevenuFormErrors {
  const errors: RevenuFormErrors = {};

  if (values.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est obligatoire.';
  }

  if (values.montant.trim().length === 0) {
    errors.montant = 'Le montant est obligatoire.';
  } else if (parseMontantEnCentimes(values.montant) === null) {
    errors.montant = 'Le montant doit être un nombre positif.';
  }

  return errors;
}
