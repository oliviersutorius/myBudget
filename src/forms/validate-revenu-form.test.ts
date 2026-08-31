import { validateRevenuForm } from '@/forms/validate-revenu-form';

describe('validateRevenuForm', () => {
  it('retourne un objet vide quand libellé et montant sont valides', () => {
    expect(validateRevenuForm({ libelle: 'Salaire', montant: '1500' })).toEqual({});
  });

  it('signale un libellé manquant', () => {
    expect(validateRevenuForm({ libelle: '', montant: '1500' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un libellé composé uniquement d’espaces', () => {
    expect(validateRevenuForm({ libelle: '   ', montant: '1500' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
    });
  });

  it('signale un montant manquant', () => {
    expect(validateRevenuForm({ libelle: 'Salaire', montant: '' })).toEqual({
      montant: 'Le montant est obligatoire.',
    });
  });

  it('signale un montant non numérique', () => {
    expect(validateRevenuForm({ libelle: 'Salaire', montant: 'abc' })).toEqual({
      montant: 'Le montant doit être un nombre positif.',
    });
  });

  it('signale un montant nul ou négatif', () => {
    expect(validateRevenuForm({ libelle: 'Salaire', montant: '-5' })).toEqual({
      montant: 'Le montant doit être un nombre positif.',
    });
  });

  it('signale les deux champs manquants', () => {
    expect(validateRevenuForm({ libelle: '', montant: '' })).toEqual({
      libelle: 'Le libellé est obligatoire.',
      montant: 'Le montant est obligatoire.',
    });
  });
});
