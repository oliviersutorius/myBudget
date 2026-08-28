export interface TypeDepenseNiveau2FormValues {
  libelle: string;
  niveau1: 'fixe' | 'variable' | null;
}

export interface TypeDepenseNiveau2FormErrors {
  libelle?: string;
  niveau1?: string;
}

// Validation pure du formulaire de type de dépense niveau 2 (ticket #7) :
// libellé et choix fixe/variable obligatoires. Le niveau 1 n'est jamais
// saisi directement (voir docs/DOMAIN.md §3.2) : c'est ce choix qui le fixe.
export function validateTypeDepenseNiveau2Form(
  values: TypeDepenseNiveau2FormValues,
): TypeDepenseNiveau2FormErrors {
  const errors: TypeDepenseNiveau2FormErrors = {};

  if (values.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est obligatoire.';
  }

  if (values.niveau1 === null) {
    errors.niveau1 = 'Choisissez fixe ou variable.';
  }

  return errors;
}
