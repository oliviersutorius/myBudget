import { useSettingsStore } from './use-settings-store';

describe('useSettingsStore', () => {
  it('a EUR comme devise par défaut', () => {
    expect(useSettingsStore.getState().currency).toBe('EUR');
  });

  it('met à jour la devise via setCurrency', () => {
    useSettingsStore.getState().setCurrency('USD');
    expect(useSettingsStore.getState().currency).toBe('USD');
  });
});
