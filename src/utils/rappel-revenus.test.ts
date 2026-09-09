import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import { IDENTIFIANT_RAPPEL_REVENUS, programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { MONTHLY: 'monthly' },
  AndroidImportance: { DEFAULT: 3 },
}));

const getPermissionsAsyncMock = jest.mocked(Notifications.getPermissionsAsync);
const setNotificationChannelAsyncMock = jest.mocked(Notifications.setNotificationChannelAsync);
const scheduleNotificationAsyncMock = jest.mocked(Notifications.scheduleNotificationAsync);

describe('programmerRappelRevenusMensuel', () => {
  const plateformeOrigine = Platform.OS;

  afterEach(() => {
    jest.clearAllMocks();
    Platform.OS = plateformeOrigine;
  });

  it('ne programme rien si la permission n’est pas accordée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'denied' } as never);

    await programmerRappelRevenusMensuel();

    expect(scheduleNotificationAsyncMock).not.toHaveBeenCalled();
  });

  it('programme le rappel du 1er du mois avec un identifiant fixe quand la permission est accordée', async () => {
    Platform.OS = 'ios';
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

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
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

    await programmerRappelRevenusMensuel();

    expect(setNotificationChannelAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('ne crée pas de canal Android sur iOS', async () => {
    Platform.OS = 'ios';
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

    await programmerRappelRevenusMensuel();

    expect(setNotificationChannelAsyncMock).not.toHaveBeenCalled();
  });

  it('n’échoue pas et signale en console une erreur inattendue plutôt que de la propager', async () => {
    const avertissement = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getPermissionsAsyncMock.mockRejectedValue(new Error('module natif indisponible'));

    await expect(programmerRappelRevenusMensuel()).resolves.toBeUndefined();

    expect(avertissement).toHaveBeenCalledTimes(1);
    avertissement.mockRestore();
  });
});
