import { chargerModuleNotifications } from '@/utils/notifications-module';
import { demanderPermissionNotificationsSiNecessaire } from '@/utils/notifications-permission';
import { programmerRappelRevenusMensuel } from '@/utils/rappel-revenus';

jest.mock('@/utils/notifications-module', () => ({
  chargerModuleNotifications: jest.fn(),
}));

jest.mock('@/utils/rappel-revenus', () => ({
  programmerRappelRevenusMensuel: jest.fn(),
}));

const chargerModuleNotificationsMock = jest.mocked(chargerModuleNotifications);
const programmerRappelRevenusMensuelMock = jest.mocked(programmerRappelRevenusMensuel);

const getPermissionsAsyncMock = jest.fn();
const requestPermissionsAsyncMock = jest.fn();

const moduleNotificationsMock = {
  getPermissionsAsync: getPermissionsAsyncMock,
  requestPermissionsAsync: requestPermissionsAsyncMock,
} as never;

describe('demanderPermissionNotificationsSiNecessaire', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ne fait rien dans Expo Go (module indisponible)', async () => {
    chargerModuleNotificationsMock.mockReturnValue(null);

    await demanderPermissionNotificationsSiNecessaire();

    expect(getPermissionsAsyncMock).not.toHaveBeenCalled();
  });

  it('demande la permission quand elle n’a jamais été tranchée', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' });
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'denied' });

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('programme le rappel dès que la permission vient tout juste d’être accordée', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' });
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'granted' });

    await demanderPermissionNotificationsSiNecessaire();

    expect(programmerRappelRevenusMensuelMock).toHaveBeenCalledTimes(1);
  });

  it('ne programme pas le rappel si l’utilisateur vient de refuser la permission', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' });
    requestPermissionsAsyncMock.mockResolvedValue({ status: 'denied' });

    await demanderPermissionNotificationsSiNecessaire();

    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('ne redemande pas une permission déjà accordée, ni ne reprogramme le rappel (déjà fait par _layout.tsx)', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' });

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('ne redemande pas une permission déjà refusée', async () => {
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockResolvedValue({ status: 'denied' });

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
    expect(programmerRappelRevenusMensuelMock).not.toHaveBeenCalled();
  });

  it('n’échoue pas et signale en console une erreur inattendue plutôt que de la propager', async () => {
    const avertissement = jest.spyOn(console, 'warn').mockImplementation(() => {});
    chargerModuleNotificationsMock.mockReturnValue(moduleNotificationsMock);
    getPermissionsAsyncMock.mockRejectedValue(new Error('module natif indisponible'));

    await expect(demanderPermissionNotificationsSiNecessaire()).resolves.toBeUndefined();

    expect(avertissement).toHaveBeenCalledTimes(1);
    avertissement.mockRestore();
  });
});
