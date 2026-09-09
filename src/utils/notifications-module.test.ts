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
  // `notificationsModule` est mis en cache au niveau du module (voir
  // notifications-module.ts) : les tests s'appuient donc sur l'ordre de
  // déclaration ci-dessous (Expo Go d'abord, pour vérifier qu'aucun
  // chargement n'est mis en cache dans ce cas, avant de vérifier le
  // chargement réel).
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

  it('ne recharge pas le module à un appel suivant (mis en cache)', () => {
    estDansExpoGoMock.mockReturnValue(false);

    const premierAppel = chargerModuleNotifications();
    const deuxiemeAppel = chargerModuleNotifications();

    expect(deuxiemeAppel).toBe(premierAppel);
  });
});
