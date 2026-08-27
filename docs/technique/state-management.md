# State management — myBudget

> Doc technique. Stores Zustand partagés entre écrans (voir `docs/WORKFLOW.md` pour la convention `zustand-agent`).

## `useCompteActifStore` (`src/store/use-compte-actif-store.ts`)

Retient l'`id` du **compte actuellement sélectionné/consulté** (`compteActifId: number | null`), utilisé par les écrans d'édition de compte et de récapitulatif mensuel pour savoir sur quel compte ils opèrent, sans avoir à faire transiter cet id via les paramètres de route à chaque navigation.

- `definirCompteActif(compteId)` remplace toujours la sélection précédente — jamais de sélection multiple, cohérent avec l'invariant "un compte n'est jamais agrégé avec un autre" (`docs/DOMAIN.md`).
- Persistance **en mémoire pour la durée de la session de navigation uniquement** (store Zustand classique, pas de middleware `persist`) : la sélection ne survit pas à un redémarrage de l'app. Si un besoin de restauration au démarrage apparaît, ce sera un changement explicite (middleware `persist` + `AsyncStorage`), pas le comportement par défaut.
