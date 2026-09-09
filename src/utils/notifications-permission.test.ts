import * as Notifications from 'expo-notifications';

import { demanderPermissionNotificationsSiNecessaire } from '@/utils/notifications-permission';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const getPermissionsAsyncMock = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsAsyncMock = jest.mocked(Notifications.requestPermissionsAsync);

describe('demanderPermissionNotificationsSiNecessaire', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('demande la permission quand elle n’a jamais été tranchée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'undetermined' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).toHaveBeenCalledTimes(1);
  });

  it('ne redemande pas une permission déjà accordée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'granted' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
  });

  it('ne redemande pas une permission déjà refusée', async () => {
    getPermissionsAsyncMock.mockResolvedValue({ status: 'denied' } as never);

    await demanderPermissionNotificationsSiNecessaire();

    expect(requestPermissionsAsyncMock).not.toHaveBeenCalled();
  });
});
