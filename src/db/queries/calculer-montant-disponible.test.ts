import { calculerMontantDisponible, sommerMontants } from './calculer-montant-disponible';
import {
  agregerMontantsNiveau3Compte,
  resolveMontantsNiveau3Compte,
  sommeTotale,
} from './resolve-montants-niveau3-compte';

describe('calculerMontantDisponible', () => {
  it('égale les revenus quand il n’y a aucune dépense', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: 0,
      sommeDepensesVariable: 0,
    });

    expect(resultat).toBe(200000);
  });

  it('soustrait les dépenses fixe et variable aux revenus', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: 110000,
      sommeDepensesVariable: 15000,
    });

    expect(resultat).toBe(200000 - 110000 - 15000);
  });

  it('peut être négatif quand les dépenses dépassent les revenus', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 50000,
      sommeDepensesFixe: 80000,
      sommeDepensesVariable: 0,
    });

    expect(resultat).toBe(-30000);
  });

  it('vaut 0 sans revenu ni dépense', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 0,
      sommeDepensesFixe: 0,
      sommeDepensesVariable: 0,
    });

    expect(resultat).toBe(0);
  });
});

describe('sommerMontants', () => {
  it('vaut 0 pour une liste vide', () => {
    expect(sommerMontants([])).toBe(0);
  });

  it('somme le montant de chaque ligne', () => {
    const resultat = sommerMontants([{ montant: 1000 }, { montant: 2500 }, { montant: 300 }]);

    expect(resultat).toBe(3800);
  });
});

// Scénarios explicitement demandés par les critères d'acceptance du ticket
// #13 : montants historisés (fixe) combinés au calcul du montant
// disponible — enchaîne resolveMontantsNiveau3Compte (résolution de
// l'historique, #9/#17), sommeTotale et calculerMontantDisponible plutôt
// que de dupliquer des totaux déjà calculés à la main.
describe('calculerMontantDisponible — avec montants historisés (#13)', () => {
  it('dépense fixe inchangée depuis plusieurs mois : même montant disponible chaque mois', () => {
    const historique = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 80000 },
    ];

    const disponibleJanvier = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-01').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });
    const disponibleJuin = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-06').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });

    expect(disponibleJanvier).toBe(120000);
    expect(disponibleJuin).toBe(120000);
  });

  it("dépense fixe modifiée en cours de mois : le mois d'effet reflète immédiatement le nouveau montant (#17)", () => {
    const historique = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 80000 },
      // Changement historisé sur le mois courant (#17 : jamais différé au
      // mois suivant), quel que soit le jour de saisie dans ce mois.
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-03', montant: 95000 },
    ];

    const disponibleAvantChangement = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-02').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });
    const disponibleMoisDuChangement = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-03').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });

    expect(disponibleAvantChangement).toBe(120000);
    expect(disponibleMoisDuChangement).toBe(105000);
  });

  it('dépense fixe disparue (montant marqué absent) : ne compte plus dans le calcul à partir de ce mois', () => {
    const historique = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 80000 },
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-04', montant: null },
    ];

    const disponibleAvantDisparition = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-03').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });
    const disponibleApresDisparition = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historique, '2026-04').sommeParNiveau2,
      ),
      sommeDepensesVariable: 0,
    });

    expect(disponibleAvantDisparition).toBe(120000);
    expect(disponibleApresDisparition).toBe(200000);
  });

  it('combine dépenses fixe (historisées) et variable (mois exact, non reconduites, #52)', () => {
    const historiqueFixe = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 80000 },
    ];
    const variableDuMois = [{ typeDepenseNiveau3Id: 2, niveau2Id: 20, montant: 4500 }];

    const resultat = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeDepensesFixe: sommeTotale(
        resolveMontantsNiveau3Compte(historiqueFixe, '2026-03').sommeParNiveau2,
      ),
      sommeDepensesVariable: sommeTotale(
        agregerMontantsNiveau3Compte(variableDuMois).sommeParNiveau2,
      ),
    });

    expect(resultat).toBe(200000 - 80000 - 4500);
  });
});
