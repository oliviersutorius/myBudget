import { validateCompteForm } from '@/forms/validate-compte-form';

describe('validateCompteForm', () => {
  it('retourne un objet vide quand nom et banque sont renseignés', () => {
    expect(validateCompteForm({ nom: 'Compte courant', banque: 'BNP' })).toEqual({});
  });

  it('signale un nom manquant', () => {
    expect(validateCompteForm({ nom: '', banque: 'BNP' })).toEqual({
      nom: 'Le nom du compte est obligatoire.',
    });
  });

  it('signale un nom composé uniquement d’espaces', () => {
    expect(validateCompteForm({ nom: '   ', banque: 'BNP' })).toEqual({
      nom: 'Le nom du compte est obligatoire.',
    });
  });

  it('signale une banque manquante', () => {
    expect(validateCompteForm({ nom: 'Compte courant', banque: '' })).toEqual({
      banque: 'La banque est obligatoire.',
    });
  });

  it('signale les deux champs manquants', () => {
    expect(validateCompteForm({ nom: '', banque: '' })).toEqual({
      nom: 'Le nom du compte est obligatoire.',
      banque: 'La banque est obligatoire.',
    });
  });
});
