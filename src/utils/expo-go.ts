import { isRunningInExpoGo } from 'expo';

/**
 * Vrai si l'app tourne dans le client Expo Go — à distinguer d'un dev
 * client (`expo-dev-client`), qui lui supporte les modules natifs
 * normalement. `isRunningInExpoGo()` (paquet `expo`) est la détection
 * fournie par Expo lui-même à cet effet (utilisée en interne par
 * `expo-notifications` pour son propre avertissement de retrait depuis le
 * SDK 53, voir `warnOfExpoGoPushUsage.ts`) — préférée à
 * `expo-constants`/`executionEnvironment`, qui confond Expo Go et dev
 * client sous la même valeur `storeClient`.
 */
export function estDansExpoGo(): boolean {
  return isRunningInExpoGo();
}
