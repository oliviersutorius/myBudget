import { decalerMois } from '@/utils/mois';

describe('decalerMois', () => {
  it('avance au mois suivant', () => {
    expect(decalerMois('2026-08', 1)).toBe('2026-09');
  });

  it('recule au mois précédent', () => {
    expect(decalerMois('2026-08', -1)).toBe('2026-07');
  });

  it('passe à l’année suivante en décembre', () => {
    expect(decalerMois('2026-12', 1)).toBe('2027-01');
  });

  it('passe à l’année précédente en janvier', () => {
    expect(decalerMois('2026-01', -1)).toBe('2025-12');
  });

  it('ne bouge pas avec un delta de 0', () => {
    expect(decalerMois('2026-08', 0)).toBe('2026-08');
  });

  it('gère un décalage de plusieurs mois avec report d’année', () => {
    expect(decalerMois('2026-11', 3)).toBe('2027-02');
  });
});
