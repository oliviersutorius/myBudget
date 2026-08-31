import { formatCentimesEnEuros, parseMontantEnCentimes } from '@/utils/montant';

describe('parseMontantEnCentimes', () => {
  it('parse un montant avec un point décimal', () => {
    expect(parseMontantEnCentimes('12.5')).toBe(1250);
  });

  it('parse un montant avec une virgule décimale', () => {
    expect(parseMontantEnCentimes('12,50')).toBe(1250);
  });

  it('parse un montant entier', () => {
    expect(parseMontantEnCentimes('1500')).toBe(150000);
  });

  it('arrondit au centime le plus proche', () => {
    expect(parseMontantEnCentimes('12.345')).toBe(1235);
  });

  it('ignore les espaces de bord', () => {
    expect(parseMontantEnCentimes('  20  ')).toBe(2000);
  });

  it('rejette une saisie vide', () => {
    expect(parseMontantEnCentimes('')).toBeNull();
  });

  it('rejette une saisie composée uniquement d’espaces', () => {
    expect(parseMontantEnCentimes('   ')).toBeNull();
  });

  it('rejette une saisie non numérique', () => {
    expect(parseMontantEnCentimes('abc')).toBeNull();
  });

  it('rejette un montant nul', () => {
    expect(parseMontantEnCentimes('0')).toBeNull();
  });

  it('rejette un montant négatif', () => {
    expect(parseMontantEnCentimes('-10')).toBeNull();
  });

  it('rejette une valeur infinie', () => {
    expect(parseMontantEnCentimes('Infinity')).toBeNull();
  });
});

// Intl.NumberFormat('fr-FR', { style: 'currency' }) insère des espaces
// insécables (U+00A0 avant "€", U+202F comme séparateur de milliers) plutôt
// que des espaces classiques — reproduites ici explicitement pour éviter un
// diff invisible entre la valeur attendue et la valeur reçue.
const ESPACE_INSECABLE = ' ';
const ESPACE_FINE_INSECABLE = ' ';

describe('formatCentimesEnEuros', () => {
  it('formate un montant en euros avec deux décimales', () => {
    expect(formatCentimesEnEuros(1234)).toBe(`12,34${ESPACE_INSECABLE}€`);
  });

  it('formate un montant rond sans perdre les décimales', () => {
    expect(formatCentimesEnEuros(150000)).toBe(
      `1${ESPACE_FINE_INSECABLE}500,00${ESPACE_INSECABLE}€`,
    );
  });

  it('formate zéro', () => {
    expect(formatCentimesEnEuros(0)).toBe(`0,00${ESPACE_INSECABLE}€`);
  });
});
