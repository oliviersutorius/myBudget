import { Platform } from 'react-native';

import { chargerModuleNotifications } from '@/utils/notifications-module';
import { IDENTIFIANT_RAPPEL_REVENUS, programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

jest.mock('@/utils/notifications-module', () => ({
  chargerModuleNotifications: jest.fn(),
}));

const chargerModuleNotificationsMock = jest.mocked(chargerModuleNotifications);

const getPermissionsAsyncMock = jest.fn();
const setNotificationChannelAsyncMock = jest.fn();
const scheduleNotificationAsyncMock = jest.fn();

const moduleNotificationsMock = {
  getPermissionsAsync: getPermissionsAsyncMock,
  setNotificationChannelAsync: setNotificationChannelAsyncMock,
  scheduleNotificationAsync: scheduleNotificationAsyncMock,
  SchedulableTriggerInputTypes: { MONTHLY: 'monthly' },
  AndroidImportance: { DEFAULT: 3 },
} as never;

describe('programmerRappelRevenusMensuel', () => {
  const plateformeOrigine = Platform.OS;

  afterEach(() => {
    jest.clearAllMocks();
    Platform.OS = plateformeOrigine;
  });

  it('ne fait rien dans Expo Go (module indisponible)', async () => {
    chargerModuleNotificationsMock.mockReturnValue(null);

    await programmerRappelRevenusMensuel();

    expect(getPermissionsAsyncMock).not.toHaveBeenCalled();
  });

  it('ne programme rien si la permission n’est pas accordée', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'denied' });

    await programmerRappelRevenusMensuel();

    expect(scheduleNotificationAsyncMock).not.toHaveBeenCalled();
  });

  it('programme le rappel du 1er du mois avec un identifiant fixe quand la permission est accordée', async () => {
    Platform.OS = 'ios';
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' });

    await programmerRappelRevenusMensuel();

    expect(scheduleNotificationAsyncMock).toHaveBeenCalledTimes(1);
    const [requete] = scheduleNotificationAsyncMock.mock.calls[0] as [
      { identifier?: string; trigger: { type: string; day: number } },
    ];
    expect(requete.identifier).toBe(IDENTIFIANT_RAPPEL_REVENUS);
    expect(requete.trigger).toMatchObject({ type: 'monthly', day: 1 });
  });

  it('crée le canal de notification Android avant de programmer, uniquement sur Android', async () => {
    Platform.OS = 'android';
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' });

    await programmerRappelRevenusMensuel();

    expect(setNotificationChannelAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('ne crée pas de canal Android sur iOS', async () => {
    Platform.OS = 'ios';
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' });

    await programmerRappelRevenusMensuel();

    expect(setNotificationChannelAsyncMock).not.toHaveBeenCalled();
  });

  it('n’échoue pas et signale en console une erreur inattendue plutôt que de la propager', async () => {
    const avertissement = jest.spyOn(console, 'warn').mockImplementation(() => {});
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockRejectedValue(new Error('module natif indisponible'));

    await expect(programmerRappelRevenusMensuel()).resolves.toBeUndefined();

    expect(avertissement).toHaveBeenCalledTimes(1);
    avertissement.mockRestore();
  });
});
