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

**`react-native-svg`**, seule dépendance d'icônes du projet (ajoutée par le ticket #41) : les glyphes Unicode utilisés jusque-là (`▾`/`▸`/`⋮`) sont remplacés par des icônes SVG traits (`<Svg><Path .../></Svg>`), sur l'onglet Dépenses et, par ricochet, sur l'onglet Revenus via le composant partagé `ActionsMenuButton`. Trois icônes locales à `src/app/comptes/[id]/edit.tsx` (`ChevronIcon`, `PlusIcon`, `KebabIcon`) : traits (`stroke`), jamais de remplissage plein sauf le kebab (3 points, `fill`) — couleur toujours pilotée par une prop résolue via `useTheme()`, jamais en dur. Restent locales à cet écran comme le reste des composants du fichier (voir le commentaire au-dessus d'`ActionsMenuButton`) ; à extraire vers `src/components/` le jour où un deuxième écran en a réellement besoin.

- **Menu d'actions de ligne** : bouton « `⋮` » (kebab, icône `KebabIcon`), ouvrant un menu natif (`Alert.alert`) listant les actions disponibles (Modifier, Supprimer, actions spécifiques comme "Marquer absente") — la suppression déclenche toujours une seconde popup de confirmation dédiée. Pattern établi sur l'onglet Revenus (ticket #12), généralisé à l'onglet Dépenses (types niveau 3) par la charte graphique (ticket #26) puis à la refonte de l'onglet Dépenses (ticket #41) via le composant partagé `ActionsMenuButton` (`src/app/comptes/[id]/edit.tsx`). **Tout nouvel écran de liste avec actions par ligne doit réutiliser ce pattern**, pas des liens texte "Modifier"/"Supprimer" sous la ligne.
- **Chevrons de dépli/repli** (`ChevronIcon`, direction `bas`/`droite`) : remplacent `▾`/`▸` pour les pavés niveau 1 et les lignes niveau 2 collapsables de l'onglet Dépenses (ticket #41).
- **Chevrons de navigation** (`‹`/`›` pour changer de mois/année) : encore des caractères Unicode simples, taille `title`, hors du périmètre du ticket #41 (navigation mois/année de RevenusTab/BudgetTab, pas concernée par la refonte de l'onglet Dépenses) — à faire migrer vers `ChevronIcon` le jour où ces écrans sont retouchés, pas de raison de les laisser en Unicode indéfiniment.
- **Zone tactile minimum 44×44** sur tout élément interactif portant une icône (bouton « + », « ⋮ », chevron de dépli/repli) : la zone visuelle de l'icône peut être plus petite (14 à 20px), mais le `Pressable`/conteneur qui la porte réserve toujours au moins 44×44 (voir `PaveNiveau1`, `LigneNiveau2`, `ActionsMenuButton` dans `edit.tsx`).
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

## Popups d'ajout

Pattern introduit par la refonte de l'onglet Dépenses (ticket #41, maquette A « Compact ») pour tout formulaire de création court (1 à 2 champs) déclenché depuis un bouton « + » — remplace les formulaires d'ajout jusque-là toujours visibles en pied de section (ex. l'ancien `AjoutTypeNiveau2Form`/`AjoutTypeNiveau3Form` de l'onglet Dépenses). Composant `Modal` natif de `react-native` (`transparent`, `animationType="fade"`, `onRequestClose` relié au bouton Annuler pour le bouton retour Android) — pas de librairie de modale tierce.

**Traitement neutre** : à la différence d'autres actions de l'app, ces popups n'utilisent pas `primary` (choix délibéré de la maquette A, cohérent avec le reste de l'onglet Dépenses, qui n'y colore aucun élément — voir « Ton visuel général » ci-dessus). Tous les textes/boutons restent en `text`/`textSecondary`/`backgroundSelected`.

- **Voile d'assombrissement** derrière la carte : `rgba(22, 35, 27, 0.5)`, c'est-à-dire le token `Colors.light.text` (`#16231B`) à 50 % d'opacité — **volontairement fixe quel que soit le thème actif** (un voile reste sombre en light comme en dark, contrairement aux autres couleurs de l'écran qui suivent `Colors.light`/`Colors.dark`). Construit via le helper `hexToRgba` (`src/utils/color.ts`) à partir du token, jamais recopié en dur, pour respecter la règle « aucune couleur en dur ».
- **Carte modale** centrée : fond `background`, `border-radius: 16`, `padding: 20px 18px 18px`, `gap: 14` entre le bloc titre/sous-titre, chaque champ et le pied de popup, ombre portée légère (`shadowOpacity`/`elevation` faibles — pas de librairie dédiée pour un effet aussi simple).
- **Titre + sous-titre** : titre `16px/700` (ex. « Ajouter un type de dépense », « Ajouter une ligne ») + sous-titre contextuel `12px` `textSecondary` rappelant où la ligne sera ajoutée (ex. « Fixe » pour une popup niveau 2, « Logement · Fixe » pour une popup niveau 3) — groupés dans un même bloc à `gap` serré, distinct du `gap: 14` du reste de la carte.
- **Champ(s)** : label `12px/600` `textSecondary` au-dessus de chaque champ, champ fond `backgroundElement`, `border-radius: 8`, `padding: 11px 12px` — un seul champ (Nom) pour un ajout niveau 2, deux (Nom, Montant) pour un ajout niveau 3.
- **Pied de popup** : « Annuler » en lien texte `14px/600` `textSecondary` + « Ajouter » en bouton plein fond `backgroundSelected` texte `text` `700`, `padding: 11px 22px`, `border-radius: 8` — alignés à droite, `gap: 20`.
- **Zones tactiles** : `Annuler` et `Ajouter` réservent chacun une hauteur minimale de 44 (voir « Iconographie » ci-dessus pour la même règle appliquée aux icônes).

Implémentation de référence : `PopupAjoutNiveau2`/`PopupAjoutNiveau3` (et les sous-composants partagés `PopupChamp`/`PopupPied`) dans `src/app/comptes/[id]/edit.tsx`.

## Hors scope de ce ticket

- **Icône d'app et splash artwork** : la couleur de fond du splash natif (`app.json`, `expo-splash-screen.backgroundColor`/`.dark.backgroundColor`) et son miroir JS (`src/components/animated-icon.tsx`) ont été alignées sur `primary` (`#457A5A` light / `#87C39C` dark) par cohérence, mais l'artwork (logo Expo par défaut dans `assets/images/`, `assets/expo.icon`) reste à remplacer par une identité myBudget — tâche de branding séparée, pas couverte ici.
- **Contraste** : les nouvelles valeurs n'ont pas fait l'objet d'un audit WCAG formel (choisies par comparaison visuelle sur maquette). Pas bloquant pour ce ticket, mais à revoir si un audit d'accessibilité dédié est planifié.
