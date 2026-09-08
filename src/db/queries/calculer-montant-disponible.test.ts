import { calculerMontantDisponible } from './calculer-montant-disponible';
import {
  resolveMontantsNiveau3Compte,
  agregerMontantsNiveau3Compte,
} from './resolve-montants-niveau3-compte';

describe('calculerMontantDisponible', () => {
  it('égale les revenus quand il n’y a aucune dépense', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: new Map(),
      sommeParNiveau2Variable: new Map(),
    });

    expect(resultat).toBe(200000);
  });

  it('soustrait les dépenses fixe et variable aux revenus', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: new Map([
        [10, 80000],
        [20, 30000],
      ]),
      sommeParNiveau2Variable: new Map([[30, 15000]]),
    });

    expect(resultat).toBe(200000 - 80000 - 30000 - 15000);
  });

  it('peut être négatif quand les dépenses dépassent les revenus', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 50000,
      sommeParNiveau2Fixe: new Map([[10, 80000]]),
      sommeParNiveau2Variable: new Map(),
    });

    expect(resultat).toBe(-30000);
  });

  it('vaut 0 sans revenu ni dépense', () => {
    const resultat = calculerMontantDisponible({
      sommeRevenus: 0,
      sommeParNiveau2Fixe: new Map(),
      sommeParNiveau2Variable: new Map(),
    });

    expect(resultat).toBe(0);
  });
});

// Scénarios explicitement demandés par les critères d'acceptance du ticket
// #13 : montants historisés (fixe) combinés au calcul du montant
// disponible — enchaîne resolveMontantsNiveau3Compte (résolution de
// l'historique, #9/#17) et calculerMontantDisponible plutôt que de
// dupliquer des Map déjà résolues à la main.
describe('calculerMontantDisponible — avec montants historisés (#13)', () => {
  it('dépense fixe inchangée depuis plusieurs mois : même montant disponible chaque mois', () => {
    const historique = [
      { typeDepenseNiveau3Id: 1, niveau2Id: 10, moisEffet: '2026-01', montant: 80000 },
    ];

    const disponibleJanvier = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-01').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
    });
    const disponibleJuin = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-06').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
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
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-02').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
    });
    const disponibleMoisDuChangement = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-03').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
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
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-03').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
    });
    const disponibleApresDisparition = calculerMontantDisponible({
      sommeRevenus: 200000,
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historique, '2026-04').sommeParNiveau2,
      sommeParNiveau2Variable: new Map(),
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
      sommeParNiveau2Fixe: resolveMontantsNiveau3Compte(historiqueFixe, '2026-03').sommeParNiveau2,
      sommeParNiveau2Variable: agregerMontantsNiveau3Compte(variableDuMois).sommeParNiveau2,
    });

    expect(resultat).toBe(200000 - 80000 - 4500);
  });
});
