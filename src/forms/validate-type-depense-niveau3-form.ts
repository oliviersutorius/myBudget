import { parseMontantEnCentimes } from '@/utils/montant';

export interface TypeDepenseNiveau3FormValues {
  libelle: string;
  niveau2Id: number | null;
  /**
   * Saisie brute du montant (ticket #9), optionnelle : absente à la
   * création (le montant se règle ensuite, voir edit.tsx), et en édition
   * une saisie vide signifie « pas de changement de montant » — ce n'est
   * pas ainsi qu'on marque une dépense absente (voir « Marquer absente »
   * dans TypeDepenseNiveau3Row).
   */
  montant?: string;
}

export interface TypeDepenseNiveau3FormErrors {
  libelle?: string;
  niveau2Id?: string;
  montant?: string;
}

// Validation pure du formulaire de type de dépense niveau 3 (ticket #8,
// étendu par #34 : le niveau 2 parent se choisit désormais via un select
// plutôt que d'être implicite au contexte d'ajout ; étendu par #9 pour le
// montant). Pas de champ niveau1 : il est hérité du niveau 2 parent (voir
// docs/DOMAIN.md §3.2), jamais saisi ici. En édition, niveau2Id vaut
// toujours le niveau 2 déjà rattaché à la ligne (jamais modifiable a
// posteriori) : la validation y est donc toujours satisfaite.
export function validateTypeDepenseNiveau3Form(
  values: TypeDepenseNiveau3FormValues,
): TypeDepenseNiveau3FormErrors {
  const errors: TypeDepenseNiveau3FormErrors = {};

  if (values.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est obligatoire.';
  }

  if (values.niveau2Id === null) {
    errors.niveau2Id = 'Choisissez un type de dépense niveau 2.';
  }

  if (
    values.montant !== undefined &&
    values.montant.trim().length > 0 &&
    parseMontantEnCentimes(values.montant) === null
  ) {
    errors.montant = 'Le montant doit être un nombre positif.';
  }

  return errors;
}
