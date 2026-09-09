import { estDansExpoGo } from '@/utils/expo-go';

type ModuleNotifications = typeof import('expo-notifications');

/**
 * Charge `expo-notifications` en import différé — jamais un `import`
 * statique en tête de fichier : le module lève une exception dès son
 * évaluation dans Expo Go depuis le retrait des notifications au SDK 53
 * (voir `expo-go.ts`). Un import statique fait planter l'app entière au
 * chargement, y compris un écran sans aucun rapport avec les notifications
 * — cassé une première fois de cette façon par les tickets #14/#19,
 * `_layout.tsx` important le module en tête de fichier empêchant tout
 * l'app de démarrer sous Expo Go. Centralisé ici plutôt que dupliqué dans
 * chaque fichier qui en a besoin (`rappel-revenus.ts`,
 * `notifications-permission.ts`, `_layout.tsx`).
 *
 * `require()` plutôt qu'un `import()` dynamique (ESM) : Metro/Hermes
 * supportent les deux, mais un `import()` dynamique s'est révélé
 * inexploitable sous Jest dans ce projet (`A dynamic import callback was
 * invoked without --experimental-vm-modules`) sans activer un flag
 * expérimental côté Jest — `require()` évalué à l'intérieur d'une fonction
 * reste tout aussi différé (jamais exécuté tant que cette fonction n'est
 * pas appelée) et fonctionne nativement dans les deux environnements.
 * Synchrone, contrairement à `import()` : pas d'`await` nécessaire côté
 * appelant. Pas de mise en cache manuelle du résultat : `require()`
 * retourne déjà la même instance en mémoire à chaque appel (comportement
 * du système de modules, CommonJS comme Metro), une variable dédiée ici
 * n'aurait fait que dupliquer ce que `require()` fait déjà gratuitement.
 *
 * Ne lève jamais : retourne `null` sans même tenter le `require` dans Expo
 * Go, et intercepte aussi un échec inattendu du `require` lui-même (ex.
 * module natif mal lié dans un dev client) plutôt que de laisser
 * l'exception remonter jusqu'à l'appelant — les fonctions appelantes
 * deviennent alors des no-op silencieux (voir leur propre documentation)
 * plutôt que de faire planter l'app entière au chargement, y compris dans
 * les deux effets de `_layout.tsx` qui appellent cette fonction en dehors
 * de tout `try`/`catch` (le montage de l'app entière, avant tout
 * ErrorBoundary).
 */
export function chargerModuleNotifications(): ModuleNotifications | null {
  if (estDansExpoGo()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import différé volontaire, voir commentaire ci-dessus
    return require('expo-notifications') as ModuleNotifications;
  } catch (error) {
    console.warn('Échec du chargement du module de notifications :', error);
    return null;
  }
}
