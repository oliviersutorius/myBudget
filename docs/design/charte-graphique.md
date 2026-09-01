# Charte graphique — myBudget

> Doc de référence design (ticket #26). Formalise les choix visuels de l'app pour que les futures maquettes (#15) et tous les écrans s'y conforment. Identité produit : **simplicité assumée** (voir `CLAUDE.md`) — pas de sur-design, des tokens minimaux mais cohérents.

## Palette de couleurs — « Sauge »

Définie dans `src/constants/theme.ts` (`Colors.light` / `Colors.dark`), consommée via le hook `useTheme()` ou la prop `themeColor` de `ThemedText`/`ThemedView`. **Ne jamais coder une couleur en dur dans un écran** — toujours passer par un token de cette palette.

| Token                | Light     | Dark      | Usage                                                        |
| -------------------- | --------- | --------- | ------------------------------------------------------------ |
| `text`               | `#16231B` | `#EAF2EC` | Texte principal                                              |
| `textSecondary`      | `#5C7568` | `#9BAFA0` | Texte secondaire (libellés, métadonnées, placeholders)       |
| `background`         | `#F5FAF6` | `#141C15` | Fond d'écran                                                 |
| `backgroundElement`  | `#E7F1E9` | `#1D291F` | Fond des éléments surélevés (cards, lignes de liste, inputs) |
| `backgroundSelected` | `#D4E6D8` | `#28382B` | État sélectionné/actif (onglet actif, ligne dépliée)         |
| `primary`            | `#457A5A` | `#87C39C` | Accent sauge — actions principales, liens mis en avant       |
| `danger`             | `#D92D20` | `#E5493C` | Erreurs, actions destructives (suppression)                  |

Trois pistes de vert ont été comparées (une plus douce/désaturée « Sauge », une émeraude vive, un pin profond) sur les onglets Dépenses et Revenus avant de retenir **Sauge**, jugée la plus cohérente avec la simplicité assumée du produit (moins « générateur de notifications », plus posée).

**Les neutres sont teintés, pas gris/blanc/noir purs** : le fond `light` est un pastel vert très léger (`#F5FAF6`, pas blanc pur) et le fond `dark` un charbon à dominante verte (`#141C15`, pas noir pur) — premier essai de cette charte en noir/blanc pur jugé inadapté en dark (aucune identité, `primary` mal intégré dessus). `text`/`textSecondary` suivent la même logique (légèrement teintés plutôt que gris neutre).

**`primary` et `danger` ont une valeur différente par mode** (contrairement au premier jet de cette charte) : chacun est éclairci en dark pour rester lisible sur le fond sombre plutôt que de trancher trop froidement dessus — `danger` en particulier est réchauffé (`#E5493C` au lieu de `#D92D20`) pour ne pas heurter sur le nouveau fond charbon vert. Neutres et accents ne sont volontairement pas étendus au-delà de ces 7 tokens (pas de `success`, `warning`, etc.) tant qu'aucun écran n'en a besoin — cohérent avec la simplicité assumée du produit ; à ajouter à cette table le jour où un besoin réel apparaît.

**Sémantique des couleurs d'action** :

- `primary` : action principale mise en avant (ex. lien "en savoir plus").
- `danger` : uniquement pour signaler une erreur ou une action destructive (bouton "Supprimer" dans un menu, message d'erreur de formulaire). Les actions destructives elles-mêmes restent confirmées par une popup native (`Alert.alert`, style `destructive`) avant exécution — voir « Ton visuel général » ci-dessous.
- Les actions neutres (Modifier, Annuler, navigation) utilisent `text`/`textSecondary`, pas `primary` — évite qu'une couleur d'accent soit diluée sur trop d'éléments à l'écran.

## Typographie

Pas de police custom chargée : l'app utilise la police système de la plateforme (`Fonts.sans` dans `theme.ts`, `system-ui` iOS / `normal` Android / `Spline Sans` sur le web via `global.css`). Choix délibéré, pas un oubli — cohérent avec la simplicité assumée : une police embarquée ajoute du poids et de la complexité (chargement asynchrone, `expo-font`, licence) pour un bénéfice de marque marginal sur une app 100% locale à 1 développeur. À revisiter seulement si un besoin d'identité visuelle plus fort émerge.

Échelle de tailles, définie dans `ThemedText` (`src/components/themed-text.tsx`, prop `type`) :

| `type`        | Taille / interligne | Graisse | Usage                                            |
| ------------- | ------------------- | ------- | ------------------------------------------------ |
| `title`       | 48 / 52             | 600     | Titre d'écran (nom du compte, "Nouveau compte…") |
| `subtitle`    | 32 / 44             | 600     | Sous-titre de section                            |
| `default`     | 16 / 24             | 500     | Texte courant                                    |
| `smallBold`   | 14 / 20             | 700     | Libellés de champ, en-têtes de ligne, totaux     |
| `small`       | 14 / 20             | 500     | Texte secondaire, contenu de ligne, erreurs      |
| `link`        | 14 / 30             | 500     | Lien/action neutre (Modifier, Annuler…)          |
| `linkPrimary` | 14 / 30             | 500     | Lien/action mise en avant (couleur `primary`)    |
| `code`        | 12                  | 500/700 | Monospace (peu utilisé actuellement)             |

Ne pas introduire de taille de police en dur dans un écran (`fontSize` ad hoc) : ajouter un nouveau `type` à `ThemedText` si l'échelle existante ne couvre pas le besoin.

## Iconographie

**Pas de librairie d'icônes** (ni `@expo/vector-icons`, ni SVG) : l'app reste sur des caractères Unicode rendus en `ThemedText`, cohérent avec l'absence d'assets graphiques à maintenir sur une app simple.

- **Menu d'actions de ligne** : bouton « `⋮` » (kebab), ouvrant un menu natif (`Alert.alert`) listant les actions disponibles (Modifier, Supprimer, actions spécifiques comme "Marquer absente") — la suppression déclenche toujours une seconde popup de confirmation dédiée. Pattern établi sur l'onglet Revenus (ticket #12), généralisé à l'onglet Dépenses (types niveau 2 et niveau 3) par ce ticket via le composant partagé `ActionsMenuButton` (`src/app/comptes/[id]/edit.tsx`). **Tout nouvel écran de liste avec actions par ligne doit réutiliser ce pattern**, pas des liens texte "Modifier"/"Supprimer" sous la ligne.
- **Chevrons de navigation** (`‹`/`›` pour changer de mois, `▾`/`▸` pour déplier/replier une ligne) : caractères Unicode simples, taille `title`/`smallBold` selon le contexte.
- `expo-symbols` (SF Symbols) est présent dans le code hérité du scaffold (`src/app/(tabs)/explore.tsx`, `src/components/ui/collapsible.tsx`) mais n'est pas le standard retenu pour les écrans myBudget — ces fichiers sont du boilerplate de démo à retirer au fil de l'eau (voir commentaire dans `jest.config.js`), pas un précédent à suivre.

## Espacements

Échelle définie dans `Spacing` (`src/constants/theme.ts`), en points, à utiliser pour tout `padding`/`margin`/`gap` :

| Token   | Valeur | Usage typique                                      |
| ------- | ------ | -------------------------------------------------- |
| `half`  | 2      | Espacement minimal (ex. libellé ↔ valeur)          |
| `one`   | 4      | Espacement serré (ex. entre lignes d'un même bloc) |
| `two`   | 8      | Rayon d'arrondi standard, padding compact          |
| `three` | 16     | Padding d'écran, gap entre sections                |
| `four`  | 24     | Padding extérieur d'écran (`safeArea`)             |
| `five`  | 32     | Grand espacement (peu utilisé actuellement)        |
| `six`   | 64     | Très grand espacement (peu utilisé actuellement)   |

Rayons d'arrondi : `Spacing.two` (8) pour les éléments compacts (inputs, chips, lignes niveau 3), `Spacing.three` (16) pour les cards/lignes plus grandes (lignes niveau 2, boutons de soumission).

## Ton visuel général

- Fonds neutres teintés sauge (jamais blanc/noir purs), un seul accent (`primary`) utilisé avec parcimonie — pas de dégradés, pas d'ombres portées marquées, pas d'illustrations.
- Cards/lignes sur fond `backgroundElement`, jamais de bordure dessinée en plus (le contraste de fond suffit à délimiter).
- Confirmations destructives systématiques via popup native (`Alert.alert`) plutôt que des UI de confirmation inline.

## Hors scope de ce ticket

- **Icône d'app et splash artwork** : la couleur de fond du splash natif (`app.json`, `expo-splash-screen.backgroundColor`/`.dark.backgroundColor`) et son miroir JS (`src/components/animated-icon.tsx`) ont été alignées sur `primary` (`#457A5A` light / `#87C39C` dark) par cohérence, mais l'artwork (logo Expo par défaut dans `assets/images/`, `assets/expo.icon`) reste à remplacer par une identité myBudget — tâche de branding séparée, pas couverte ici.
- **Contraste** : les nouvelles valeurs n'ont pas fait l'objet d'un audit WCAG formel (choisies par comparaison visuelle sur maquette). Pas bloquant pour ce ticket, mais à revoir si un audit d'accessibilité dédié est planifié.
