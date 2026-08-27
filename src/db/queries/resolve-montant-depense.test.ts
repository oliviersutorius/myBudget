import { resolveMontantDepense } from './resolve-montant-depense';

describe('resolveMontantDepense', () => {
  it("retourne null quand l'historique est vide", () => {
    expect(resolveMontantDepense([], '2026-03')).toBeNull();
  });

  it('retourne null pour un mois antérieur à toute entrée (dépense pas encore créée)', () => {
    const historique = [{ moisEffet: '2026-02', montant: 5000 }];

    expect(resolveMontantDepense(historique, '2026-01')).toBeNull();
  });

  it('reconduit le montant sur les mois suivants sans nouvelle entrée (montant stable)', () => {
    const historique = [{ moisEffet: '2026-01', montant: 5000 }];

    expect(resolveMontantDepense(historique, '2026-01')).toBe(5000);
    expect(resolveMontantDepense(historique, '2026-04')).toBe(5000);
  });

  it("applique le nouveau montant à partir de son mois d'effet (montant modifié)", () => {
    const historique = [
      { moisEffet: '2026-01', montant: 5000 },
      { moisEffet: '2026-03', montant: 6000 },
    ];

    expect(resolveMontantDepense(historique, '2026-02')).toBe(5000);
    expect(resolveMontantDepense(historique, '2026-03')).toBe(6000);
    expect(resolveMontantDepense(historique, '2026-06')).toBe(6000);
  });

  it('traite une dépense comme absente à partir du mois où son montant devient null (disparition)', () => {
    const historique = [
      { moisEffet: '2026-01', montant: 5000 },
      { moisEffet: '2026-03', montant: null },
    ];

    expect(resolveMontantDepense(historique, '2026-02')).toBe(5000);
    expect(resolveMontantDepense(historique, '2026-03')).toBeNull();
    expect(resolveMontantDepense(historique, '2026-06')).toBeNull();
  });

  it('fait réapparaître la dépense à partir du mois où un nouveau montant est défini (réapparition)', () => {
    const historique = [
      { moisEffet: '2026-01', montant: 5000 },
      { moisEffet: '2026-03', montant: null },
      { moisEffet: '2026-05', montant: 4500 },
    ];

    expect(resolveMontantDepense(historique, '2026-04')).toBeNull();
    expect(resolveMontantDepense(historique, '2026-05')).toBe(4500);
    expect(resolveMontantDepense(historique, '2026-12')).toBe(4500);
  });

  it("ne dépend pas de l'ordre des entrées dans le tableau source", () => {
    const historique = [
      { moisEffet: '2026-05', montant: 4500 },
      { moisEffet: '2026-01', montant: 5000 },
      { moisEffet: '2026-03', montant: null },
    ];

    expect(resolveMontantDepense(historique, '2026-02')).toBe(5000);
    expect(resolveMontantDepense(historique, '2026-05')).toBe(4500);
  });
});
