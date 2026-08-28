import { validateTypeDepenseNiveau2Form } from '@/forms/validate-type-depense-niveau2-form';

describe('validateTypeDepenseNiveau2Form', () => {
  it('retourne un objet vide quand libellé et niveau1 sont renseignés', () => {
    expect(validateTypeDepenseNiveau2Form({ libelle: 'Maison', niveau1: 'fixe' })).toEqual({});
  });

  it('signale un libellé manquant', () => {
    expect(validateTypeDepenseNiveau2Form({ libelle: '', niveau1: 'variable' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un libellé composé uniquement d’espaces', () => {
    expect(validateTypeDepenseNiveau2Form({ libelle: '   ', niveau1: 'fixe' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un niveau1 non choisi', () => {
    expect(validateTypeDepenseNiveau2Form({ libelle: 'Maison', niveau1: null })).toEqual({
      niveau1: 'Choisissez fixe ou variable.',
    });
  });

  it('signale les deux champs manquants', () => {
    expect(validateTypeDepenseNiveau2Form({ libelle: '', niveau1: null })).toEqual({
      libelle: 'Le libellé est obligatoire.',
      niveau1: 'Choisissez fixe ou variable.',
    });
  });
});
