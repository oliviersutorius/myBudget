import { isRunningInExpoGo } from 'expo';

import { estDansExpoGo } from '@/utils/expo-go';

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(),
}));

const isRunningInExpoGoMock = jest.mocked(isRunningInExpoGo);

describe('estDansExpoGo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reflète isRunningInExpoGo (paquet expo) quand vrai', () => {
    isRunningInExpoGoMock.mockReturnValue(true);

    expect(estDansExpoGo()).toBe(true);
  });

  it('reflète isRunningInExpoGo (paquet expo) quand faux', () => {
    isRunningInExpoGoMock.mockReturnValue(false);

    expect(estDansExpoGo()).toBe(false);
  });
});
