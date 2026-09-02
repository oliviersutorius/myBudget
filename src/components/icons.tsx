import Svg, { Circle, Path } from 'react-native-svg';

export type IconProps = {
  /** Toujours fourni par l'appelant via un token `theme.xxx` — jamais de couleur en dur ici. */
  color: string;
  size?: number;
};

/**
 * Icônes SVG traits (ticket #41, maquette « A — Compact ») : remplacent les
 * caractères Unicode (`▾`/`▸`, `⋮`) précédemment utilisés pour ces 3 usages —
 * voir docs/design/charte-graphique.md § Iconographie. Composants purement
 * présentationnels (pas de logique à tester), exclus de la couverture Jest
 * comme `themed-text.tsx`/`themed-view.tsx` (voir jest.config.js).
 */

/**
 * Chevron pointant vers le bas quand `open`, vers la droite sinon — repli/
 * dépliage d'un pavé ou d'une ligne (`Niveau1Pave`, `Niveau2Ligne`).
 */
export function ChevronIcon({ color, size = 14, open }: IconProps & { open: boolean }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}
    >
      <Path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Croix d'ajout — boutons « + » ouvrant les popups d'ajout niveau 2/niveau 3. */
export function PlusIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 2v12M2 8h12" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** 3 points verticaux — bouton « ⋮ » du menu d'actions (`ActionsMenuButton`). */
export function KebabIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Circle cx="8" cy="3" r="1.5" fill={color} />
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="13" r="1.5" fill={color} />
    </Svg>
  );
}
