/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Palette myBudget « Sauge » (charte graphique, ticket #26) : neutres teintés
// vert (fond pastel très léger en light, charbon à dominante verte — jamais
// noir pur — en dark) + `primary` (accent sauge, actions principales) et
// `danger` (erreurs, suppression). Contrairement au premier jet de cette
// charte, `primary` et `danger` ont chacun une valeur différente par mode :
// éclaircis en dark pour rester lisibles sur un fond sombre plutôt que de
// trancher trop froidement dessus. Voir docs/design/charte-graphique.md.
export const Colors = {
  light: {
    text: '#16231B',
    background: '#F5FAF6',
    backgroundElement: '#E7F1E9',
    backgroundSelected: '#D4E6D8',
    textSecondary: '#5C7568',
    primary: '#457A5A',
    danger: '#D92D20',
  },
  dark: {
    text: '#EAF2EC',
    background: '#141C15',
    backgroundElement: '#1D291F',
    backgroundSelected: '#28382B',
    textSecondary: '#9BAFA0',
    primary: '#87C39C',
    danger: '#E5493C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Voile plein écran des popups modales (`AjoutPopup` dans
// comptes/[id]/edit.tsx, `ConfirmationSuppressionPopup`) : dérivé du token
// `text` en light à 50% d'opacité, indépendant du thème actif — assombrit
// aussi bien un fond clair qu'un fond sombre. Centralisé ici (plutôt que
// redéfini dans chaque popup, voir review PR #48) pour qu'un futur ajustement
// (opacité, contraste) ne se fasse qu'à un seul endroit.
export const PopupOverlayColor = `${Colors.light.text}80`;
