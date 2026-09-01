import { hexToRgba } from '@/utils/color';

describe('hexToRgba', () => {
  it('convertit une couleur hex (avec #) en rgba à l’opacité donnée', () => {
    expect(hexToRgba('#16231B', 0.5)).toBe('rgba(22, 35, 27, 0.5)');
  });

  it('accepte une couleur hex sans le # initial', () => {
    expect(hexToRgba('16231B', 0.5)).toBe('rgba(22, 35, 27, 0.5)');
  });

  it('gère les bornes d’opacité 0 et 1', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
    expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });
});
