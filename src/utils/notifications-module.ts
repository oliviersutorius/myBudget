import { estDansExpoGo } from '@/utils/expo-go';

type ModuleNotifications = typeof import('expo-notifications');

let notificationsModule: ModuleNotifications | null | undefined;

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
 * appelant.
 *
 * Retourne `null` sans même tenter le `require` dans Expo Go — les
 * fonctions appelantes deviennent alors des no-op silencieux (voir leur
 * propre documentation) plutôt que d'échouer. Le résultat hors Expo Go est
 * mis en cache (chargé une seule fois par session, comme un `import`
 * statique classique l'aurait fait).
 */
export function chargerModuleNotifications(): ModuleNotifications | null {
  if (estDansExpoGo()) {
    return null;
  }

  if (notificationsModule === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import différé volontaire, voir commentaire ci-dessus
    notificationsModule = require('expo-notifications') as ModuleNotifications;
  }

  return notificationsModule;
}
