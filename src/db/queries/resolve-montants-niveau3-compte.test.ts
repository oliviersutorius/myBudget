import { resolveMontantsNiveau3Compte } from './resolve-montants-niveau3-compte';

describe('resolveMontantsNiveau3Compte', () => {
  it("retourne des maps vides quand l'historique est vide", () => {
    const resultat = resolveMontantsNiveau3Compte([], '2026-03');

    expect(resultat.montantsParType3.size).toBe(0);
    expect(resultat.sommeParNiveau2.size).toBe(0);
  });

  it('résout un montant stable sur plusieurs mois pour un seul type niveau 3', () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
    ];

    const resultat = resolveMontantsNiveau3Compte(lignes, '2026-06');

    expect(resultat.montantsParType3.get(1)).toBe(5000);
    expect(resultat.sommeParNiveau2.get(10)).toBe(5000);
  });

  it("applique le nouveau montant à partir de son mois d'effet (changement)", () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-03', montant: 6000 },
    ];

    expect(resolveMontantsNiveau3Compte(lignes, '2026-02').montantsParType3.get(1)).toBe(5000);
    expect(resolveMontantsNiveau3Compte(lignes, '2026-03').montantsParType3.get(1)).toBe(6000);
  });

  it('somme plusieurs types niveau 3 sous le même niveau 2', () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
      { typeDepenseNiveau3Id: 2, niveau2Id: 10, moisEffet: '2026-01', montant: 3000 },
    ];

    const resultat = resolveMontantsNiveau3Compte(lignes, '2026-01');

    expect(resultat.sommeParNiveau2.get(10)).toBe(8000);
  });

  it('sépare les sommes de deux niveau 2 différents', () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
      { typeDepenseNiveau3Id: 2, niveau2Id: 20, moisEffet: '2026-01', montant: 3000 },
    ];

    const resultat = resolveMontantsNiveau3Compte(lignes, '2026-01');

    expect(resultat.sommeParNiveau2.get(10)).toBe(5000);
    expect(resultat.sommeParNiveau2.get(20)).toBe(3000);
  });

  it('compte une dépense absente (résolue à null) pour 0 dans la somme (disparition)', () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-03', montant: null },
      { typeDepenseNiveau3Id: 2, niveau2Id: 10, moisEffet: '2026-01', montant: 3000 },
    ];

    const resultat = resolveMontantsNiveau3Compte(lignes, '2026-03');

    expect(resultat.montantsParType3.get(1)).toBeNull();
    expect(resultat.sommeParNiveau2.get(10)).toBe(3000);
  });

  it('fait réapparaître la dépense dans la somme à partir du mois de réapparition', () => {
    const lignes = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 5000 },
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-03', montant: null },
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-05', montant: 4500 },
    ];

    expect(resolveMontantsNiveau3Compte(lignes, '2026-04').sommeParNiveau2.get(10)).toBe(0);
    expect(resolveMontantsNiveau3Compte(lignes, '2026-05').sommeParNiveau2.get(10)).toBe(4500);
  });
});
