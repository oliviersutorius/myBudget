# Prévisualiser l'app — myBudget

> Doc technique. Comment voir le rendu de l'app pendant le développement.

## Méthode retenue : Expo Go

Pas de dev client nécessaire à ce stade du projet : tous les modules natifs actuellement utilisés sont pris en charge par **Expo Go** (SDK 57) sans build personnalisé.

- `expo-sqlite` (base de données locale) est inclus dans Expo Go.
- `@expo/ui` et `expo-glass-effect` fonctionnent dans Expo Go depuis les SDK 55/56 (installés dans ce projet mais pas encore utilisés dans l'UI).
- `NativeTabs` (`expo-router/unstable-native-tabs`, utilisé dans `src/components/app-tabs.tsx`) fonctionne dans Expo Go, malgré son statut "unstable" (l'API peut changer d'une version mineure à l'autre).

**Limite connue** : l'effet Liquid Glass d'`expo-glass-effect` est décrit comme moins fiable dans Expo Go que dans un vrai build — sans impact aujourd'hui puisqu'il n'est pas encore utilisé dans l'UI. À réévaluer si un écran l'utilise un jour.

Si un futur module natif ajouté au projet n'est pas pris en charge par Expo Go, il faudra basculer sur un **dev client** (`npx expo run:ios` / `npx expo run:android` en local, ou `eas build --profile development` — build manuel, voir `docs/WORKFLOW.md`). Pas anticipé tant que le besoin ne se présente pas.

## Lancer la preview

1. Installer l'app **Expo Go** sur le téléphone (recherche "Expo Go" sur l'App Store ou Google Play).
2. Depuis la racine du projet :

   ```bash
   npm run start
   ```

3. Scanner le QR code affiché dans le terminal :
   - **Android** : scanner intégré à l'app Expo Go.
   - **iOS** : appareil photo natif (ouvre automatiquement le lien vers Expo Go).

## Erreur connue (bruit de log à ignorer) — corrigée

`app.json` avait `web.output: "static"` (hérité du scaffold `create-expo-app`), qui déclenche un rendu serveur web **au démarrage même**, avant toute connexion d'un appareil. Ce rendu échoue systématiquement à cause d'un import `.wasm` non résolu par Metro (`expo-sqlite/web/worker.ts`, variante web du module SQLite, jamais utilisée par Expo Go sur mobile) :

```
Metro error: Unable to resolve module ./wa-sqlite/wa-sqlite.wasm ...
```

Sans impact sur la connexion Expo Go (bundle natif indépendant), mais bruyant et déroutant dans les logs à chaque lancement — `web.output` est passé à `"single"` pour supprimer ce rendu serveur inutile (le web n'est de toute façon pas une cible de myBudget, voir `CLAUDE.md`).

## Réseau (WSL2)

Par défaut, Metro sert l'app en mode LAN (`http://<ip-locale>:8081`). Si le téléphone n'arrive pas à joindre le serveur — cas fréquent en développant depuis **WSL2**, dont la carte réseau virtuelle est isolée de l'hôte physique — relancer en mode tunnel :

```bash
npx expo start --tunnel
```

## Limite de cet environnement (agents Claude Code)

Aucun simulateur/device n'est disponible dans l'environnement d'exécution des agents — la vérification visuelle des écrans reste à faire par toi, sur ton téléphone via Expo Go, avant chaque Review N2 sur une PR touchant l'UI.
