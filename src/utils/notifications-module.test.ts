import { estDansExpoGo } from '@/utils/expo-go';
import { chargerModuleNotifications } from '@/utils/notifications-module';

jest.mock('@/utils/expo-go', () => ({
  estDansExpoGo: jest.fn(),
}));

// Marqueur distinct d'un vrai export d'expo-notifications : suffit à
// vérifier que c'est bien ce module mocké qui est retourné, sans dépendre
// de la forme réelle de l'API expo-notifications ici.
jest.mock('expo-notifications', () => ({ marqueur: 'module-expo-notifications-charge' }));

const estDansExpoGoMock = jest.mocked(estDansExpoGo);

describe('chargerModuleNotifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retourne null dans Expo Go, sans tenter de charger le module', () => {
    estDansExpoGoMock.mockReturnValue(true);

    expect(chargerModuleNotifications()).toBeNull();
  });

  it('charge et retourne le module hors Expo Go', () => {
    estDansExpoGoMock.mockReturnValue(false);

    expect(chargerModuleNotifications()).toMatchObject({
      marqueur: 'module-expo-notifications-charge',
    });
  });

  it('retourne la même référence à un appel suivant (déjà garanti par le cache de require(), voir commentaire du fichier)', () => {
    estDansExpoGoMock.mockReturnValue(false);

    const premierAppel = chargerModuleNotifications();
    const deuxiemeAppel = chargerModuleNotifications();

    expect(deuxiemeAppel).toBe(premierAppel);
  });

  // Dernier test du fichier : jest.resetModules() vide le registre de
  // modules sans le restaurer ensuite (pas de test suivant à protéger ici).
  // jest.doMock (par opposition au jest.mock hoisté en tête de fichier)
  // permet de changer le mock d'expo-notifications pour ce seul require()
  // frais, afin de simuler un échec du require lui-même (ex. module natif
  // mal lié dans un dev client) plutôt que le cas Expo Go déjà couvert
  // ci-dessus.
  it('retourne null et signale en console si le require échoue de façon inattendue (hors Expo Go)', () => {
    const avertissement = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.resetModules();
    jest.doMock('@/utils/expo-go', () => ({ estDansExpoGo: () => false }));
    jest.doMock('expo-notifications', () => {
      throw new Error('module natif indisponible');
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- require() nécessaire pour re-résoudre le module avec les doMock ci-dessus
    const {
      chargerModuleNotifications: chargerApresReset,
    } = require('@/utils/notifications-module');

    expect(chargerApresReset()).toBeNull();
    expect(avertissement).toHaveBeenCalledTimes(1);

    avertissement.mockRestore();
  });
});
