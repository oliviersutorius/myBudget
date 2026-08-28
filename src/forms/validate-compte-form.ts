export interface CompteFormValues {
  nom: string;
  banque: string;
}

export interface CompteFormErrors {
  nom?: string;
  banque?: string;
}

// Validation pure du formulaire de création de compte (ticket #5) : nom et
// banque sont obligatoires. Extraite de l'écran pour être testable
// unitairement (src/app/** est exclu de la couverture, voir jest.config.js).
export function validateCompteForm(values: CompteFormValues): CompteFormErrors {
  const errors: CompteFormErrors = {};

  if (values.nom.trim().length === 0) {
    errors.nom = 'Le nom du compte est obligatoire.';
  }

  if (values.banque.trim().length === 0) {
    errors.banque = 'La banque est obligatoire.';
  }

  return errors;
}
