# Navigation — myBudget

> Doc technique. Structure de routing Expo Router (voir `docs/technique/preview.md` pour le contexte NativeTabs).

## Structure

```
src/app/
  _layout.tsx          # Stack racine (migrations DB, thème, splash)
  (tabs)/
    _layout.tsx         # NativeTabs (Accueil)
    index.tsx
  comptes/
    create.tsx
    [id]/edit.tsx
```

> L'onglet "Explore" (démo par défaut du scaffold Expo Router) a été retiré lors de l'audit #47 : contenu générique sans lien avec le domaine myBudget. Le groupe `(tabs)` ne porte plus qu'un seul écran à ce jour ; sa structure reste en place pour accueillir de futurs onglets.

## Pourquoi un `Stack` racine + un groupe `(tabs)`

`NativeTabs` (`expo-router/unstable-native-tabs`) n'enregistre **que** les routes déclarées explicitement via `<NativeTabs.Trigger name="...">` dans son layout — contrairement à `Stack`, qui enregistre automatiquement toutes les routes du système de fichiers présentes dans son contexte. Une route non déclarée comme `Trigger` n'est pas un onglet caché : elle n'existe simplement pas pour ce navigateur, et `router.push(...)` vers cette route échoue silencieusement (aucune erreur, aucune navigation).

Concrètement, avoir `comptes/create.tsx` en frère direct de `index.tsx` sous un layout racine qui rend directement `<NativeTabs>` rend le bouton "+" **non cliquable** : le tap déclenche bien `router.push('/comptes/create')`, mais aucun navigateur ne connaît cette route.

La correction : l'écran à onglet (`index`) est regroupé sous `(tabs)/`, avec son propre `_layout.tsx` qui porte le `NativeTabs`. Le layout racine (`src/app/_layout.tsx`) redevient un `Stack` classique, qui inclut automatiquement `(tabs)` **et** les écrans hors-onglets (`comptes/create`, `comptes/[id]/edit`) comme des écrans empilables (back natif, geste de retour iOS, bouton retour Android).
