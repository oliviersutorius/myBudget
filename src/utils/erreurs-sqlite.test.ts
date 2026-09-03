import { estErreurContrainteForeignKey } from '@/utils/erreurs-sqlite';

describe('estErreurContrainteForeignKey', () => {
  it('détecte une Error dont le message contient le texte de la contrainte SQLite', () => {
    expect(estErreurContrainteForeignKey(new Error('FOREIGN KEY constraint failed'))).toBe(true);
  });

  it('détecte le texte même noyé dans un message plus long', () => {
    expect(
      estErreurContrainteForeignKey(
        new Error('SQLite error: FOREIGN KEY constraint failed (code 787)'),
      ),
    ).toBe(true);
  });

  it('rejette une Error dont le message ne correspond pas', () => {
    expect(estErreurContrainteForeignKey(new Error('UNIQUE constraint failed'))).toBe(false);
  });

  it('rejette une valeur qui n’est pas une Error', () => {
    expect(estErreurContrainteForeignKey('FOREIGN KEY constraint failed')).toBe(false);
    expect(estErreurContrainteForeignKey(null)).toBe(false);
    expect(estErreurContrainteForeignKey(undefined)).toBe(false);
  });
});
