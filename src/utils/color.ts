/**
 * Convertit une couleur hexadécimale (`#RRGGBB` ou `RRGGBB`) en chaîne CSS
 * `rgba(...)` à l'opacité donnée. Utilisé par le voile d'assombrissement des
 * popups d'ajout (ticket #41) : le voile doit rester sombre quel que soit le
 * thème actif (contrairement aux autres couleurs de l'écran, qui suivent
 * `Colors.light`/`Colors.dark`) — on construit donc sa teinte à partir du
 * token fixe `Colors.light.text` via ce helper plutôt que de recopier sa
 * valeur hex en dur dans l'écran, pour respecter la règle « aucune couleur
 * en dur » de la charte graphique (voir docs/design/charte-graphique.md).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const valeur = hex.replace('#', '');
  const r = parseInt(valeur.substring(0, 2), 16);
  const g = parseInt(valeur.substring(2, 4), 16);
  const b = parseInt(valeur.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
