import { validateTypeDepenseNiveau3Form } from '@/forms/validate-type-depense-niveau3-form';

describe('validateTypeDepenseNiveau3Form', () => {
  it('retourne un objet vide quand le libellé et le niveau2Id sont renseignés', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: 1 })).toEqual(
      {},
    );
  });

  it('signale un libellé manquant', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: '', niveau2Id: 1 })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un libellé composé uniquement d’espaces', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: '   ', niveau2Id: 1 })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un niveau2Id non choisi', () => {
    expect(
      validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: null }),
    ).toEqual({
      niveau2Id: 'Choisissez un type de dépense niveau 2.',
    });
  });

  it('signale les deux champs manquants', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: '', niveau2Id: null })).toEqual({
      libelle: 'Le libellé est obligatoire.',
      niveau2Id: 'Choisissez un type de dépense niveau 2.',
    });
  });
});
