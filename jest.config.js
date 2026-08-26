/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // routes Expo Router : couvertes en priorité par les tests e2e Maestro
    '!src/db/schema.ts', // déclaratif (définition de tables) — pas de logique à tester ici
    '!src/db/client.ts', // wiring de la connexion SQLite native — testé via l'e2e Maestro, pas en unitaire

    // Boilerplate de démo livré par `create-expo-app` (tabs/icônes/thème d'exemple) —
    // à supprimer (ou à tester) au fur et à mesure qu'ils sont remplacés par du vrai code
    // myBudget. Retirer ces lignes une fois les fichiers correspondants supprimés.
    '!src/components/animated-icon.tsx',
    '!src/components/animated-icon.web.tsx',
    '!src/components/app-tabs.tsx',
    '!src/components/app-tabs.web.tsx',
    '!src/components/external-link.tsx',
    '!src/components/hint-row.tsx',
    '!src/components/themed-text.tsx',
    '!src/components/themed-view.tsx',
    '!src/components/web-badge.tsx',
    '!src/components/ui/collapsible.tsx',
    '!src/hooks/use-color-scheme.ts',
    '!src/hooks/use-color-scheme.web.ts',
    '!src/hooks/use-theme.ts',
    '!src/constants/theme.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
