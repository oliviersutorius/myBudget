import { validateTypeDepenseNiveau3Form } from '@/forms/validate-type-depense-niveau3-form';

describe('validateTypeDepenseNiveau3Form', () => {
  it('retourne un objet vide quand le libellé est renseigné', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier' })).toEqual({});
  });

  it('signale un libellé manquant', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: '' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un libellé composé uniquement d’espaces', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: '   ' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });
});
