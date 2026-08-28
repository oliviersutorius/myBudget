export interface TypeDepenseNiveau3FormValues {
  libelle: string;
}

export interface TypeDepenseNiveau3FormErrors {
  libelle?: string;
}

// Validation pure du formulaire de type de dépense niveau 3 (ticket #8) :
// libellé obligatoire. Pas de champ niveau1 : il est hérité du niveau 2
// parent (voir docs/DOMAIN.md §3.2), jamais saisi ici.
export function validateTypeDepenseNiveau3Form(
  values: TypeDepenseNiveau3FormValues,
): TypeDepenseNiveau3FormErrors {
  const errors: TypeDepenseNiveau3FormErrors = {};

  if (values.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est obligatoire.';
  }

  return errors;
}
