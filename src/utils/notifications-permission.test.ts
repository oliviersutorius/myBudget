import * as Notifications from 'expo-notifications';

import { demanderPermissionNotificationsSiNecessaire } from '@/utils/notifications-permission';
import { programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('@/utils/rappel-revenus', () => ({
  programmerRappelRevenusMensuel: jest.fn(),
}));

const getPermissionsAsyncMock = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsAsyncMock = jest.mocked(Notifications.requestPermissionsAsync);
const programmerRappelRevenusMensuelMock = jest.mocked(programmerRappelRevenusMensuel);

describe('demanderPermissionNotificationsSiNecessaire', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('demande la permission quand elle n’a jamais été tranchée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' } as never);
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'denied' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('programme le rappel dès que la permission vient tout juste d’être accordée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' } as never);
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(programmerRappelRevenusMensuelMock).toHaveBeenCalledTimes(1);
  });

  it('ne programme pas le rappel si l’utilisateur vient de refuser la permission', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' } as never);
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'denied' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('ne redemande pas une permission déjà accordée, ni ne reprogramme le rappel (déjà fait par _layout.tsx)', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('ne redemande pas une permission déjà refusée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'denied' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('n’échoue pas et signale en console une erreur inattendue plutôt que de la propager', async () => {
    const avertissement = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getPermissionsAsyncMock.mockRejectedValue(new Error('module natif indisponible'));

    await expect(demanderPermissionNotificationsSiNecessaire()).resolves.toBeUndefined();

    expect(avertissement).toHaveBeenCalledTimes(1);
    avertissement.mockRestore();
  });
});
