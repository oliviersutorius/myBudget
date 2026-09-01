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

  it('ignore le montant quand il est absent (création, sans champ montant)', () => {
    expect(validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: 1 })).toEqual(
      {},
    );
  });

  it('accepte un montant vide (édition sans changement de montant)', () => {
    expect(
      validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: 1, montant: '' }),
    ).toEqual({});
  });

  it('accepte un montant positif valide', () => {
    expect(
      validateTypeDepenseNiveau3Form({
        libelle: 'Crédit immobilier',
        niveau2Id: 1,
        montant: '850,50',
      }),
    ).toEqual({});
  });

  it('signale un montant non numérique', () => {
    expect(
      validateTypeDepenseNiveau3Form({
        libelle: 'Crédit immobilier',
        niveau2Id: 1,
        montant: 'abc',
      }),
    ).toEqual({
      montant: 'Le montant doit être un nombre positif.',
    });
  });

  it('signale un montant nul ou négatif', () => {
    expect(
      validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: 1, montant: '0' }),
    ).toEqual({
      montant: 'Le montant doit être un nombre positif.',
    });
  });

  // montantRequis: true (ticket #41) : la popup d'ajout niveau 3 collecte le
  // montant dès la création (contrairement à l'édition, où un champ vide
  // signifie « pas de changement » — voir les tests ci-dessus, inchangés).
  describe('avec montantRequis: true (popup d’ajout)', () => {
    it('signale un montant absent', () => {
      expect(
        validateTypeDepenseNiveau3Form({ libelle: 'Crédit immobilier', niveau2Id: 1 }, true),
      ).toEqual({
        montant: 'Le montant est obligatoire.',
      });
    });

    it('signale un montant vide', () => {
      expect(
        validateTypeDepenseNiveau3Form(
          { libelle: 'Crédit immobilier', niveau2Id: 1, montant: '' },
          true,
        ),
      ).toEqual({
        montant: 'Le montant est obligatoire.',
      });
    });

    it('signale un montant non numérique', () => {
      expect(
        validateTypeDepenseNiveau3Form(
          { libelle: 'Crédit immobilier', niveau2Id: 1, montant: 'abc' },
          true,
        ),
      ).toEqual({
        montant: 'Le montant doit être un nombre positif.',
      });
    });

    it('accepte un montant positif valide', () => {
      expect(
        validateTypeDepenseNiveau3Form(
          { libelle: 'Crédit immobilier', niveau2Id: 1, montant: '850,50' },
          true,
        ),
      ).toEqual({});
    });

    it('cumule l’erreur de montant obligatoire avec les autres erreurs', () => {
      expect(validateTypeDepenseNiveau3Form({ libelle: '', niveau2Id: null }, true)).toEqual({
        libelle: 'Le libellé est obligatoire.',
        niveau2Id: 'Choisissez un type de dépense niveau 2.',
        montant: 'Le montant est obligatoire.',
      });
    });
  });
});
