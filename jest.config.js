/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  // `src/constants/theme.ts` importe `global.css` (boilerplate web de
  // `create-expo-app`) : Jest ne sait pas parser du CSS, on le remplace par
  // un module vide. Nécessaire dès qu'un test (premier cas : ticket #16,
  // `actions-menu-button.test.tsx`) importe un composant qui dépend de
  // `useTheme` -> `theme.ts`.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/__mocks__/style-mock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // routes Expo Router : couvertes en priorité par les tests e2e Maestro
    '!src/db/schema.ts', // déclaratif (définition de tables) — pas de logique à tester ici
    '!src/db/client.ts', // wiring de la connexion SQLite native — testé via l'e2e Maestro, pas en unitaire
    '!src/db/queries/get-montant-depense-niveau3.ts', // wiring Drizzle mince — logique de résolution testée séparément (resolve-montant-depense.ts)
    '!src/db/queries/get-comptes.ts', // requête déclarative pure (comme schema.ts) — rien à tester unitairement
    '!src/db/queries/create-compte.ts', // idem : insertion mince, validation testée séparément (validate-compte-form.ts)
    '!src/db/queries/get-compte.ts', // idem : requête déclarative pure
    '!src/db/queries/update-compte.ts', // idem : mise à jour mince, validation testée séparément (validate-compte-form.ts)
    '!src/db/queries/delete-compte.ts', // idem : suppression mince
    '!src/db/queries/get-types-depense-niveau2.ts', // idem : requête déclarative pure
    '!src/db/queries/create-type-depense-niveau2.ts', // idem : insertion mince, validation testée séparément (validate-type-depense-niveau2-form.ts)
    '!src/db/queries/update-type-depense-niveau2.ts', // idem : mise à jour mince, validation testée séparément (validate-type-depense-niveau2-form.ts)
    '!src/db/queries/delete-type-depense-niveau2.ts', // idem : suppression mince
    '!src/db/queries/get-types-depense-niveau3.ts', // idem : requête déclarative pure
    '!src/db/queries/create-type-depense-niveau3.ts', // idem : insertion mince, validation testée séparément (validate-type-depense-niveau3-form.ts)
    '!src/db/queries/update-type-depense-niveau3.ts', // idem : mise à jour mince, validation testée séparément (validate-type-depense-niveau3-form.ts)
    '!src/db/queries/delete-type-depense-niveau3.ts', // idem : suppression mince
    '!src/db/queries/create-revenu.ts', // idem : insertion mince, validation testée séparément (validate-revenu-form.ts)
    '!src/db/queries/get-revenus.ts', // idem : requête déclarative pure
    '!src/db/queries/update-revenu.ts', // idem : mise à jour mince, validation testée séparément (validate-revenu-form.ts)
    '!src/db/queries/delete-revenu.ts', // idem : suppression mince
    '!src/db/queries/get-montants-historique-compte.ts', // idem : requête déclarative pure
    '!src/db/queries/set-montant-depense-niveau3.ts', // idem : upsert mince, validation testée séparément (validate-type-depense-niveau3-form.ts)
    '!src/components/animated-icon.tsx', // timing du splash natif (SplashScreen + animation) — testé via l'e2e Maestro
    '!src/components/animated-icon.web.tsx',
    '!src/components/icons.tsx', // icônes SVG purement présentationnelles (ticket #41) — pas de logique à tester

    // Boilerplate de démo livré par `create-expo-app` (tabs/icônes/thème d'exemple) —
    // à supprimer (ou à tester) au fur et à mesure qu'ils sont remplacés par du vrai code
    // myBudget. Retirer ces lignes une fois les fichiers correspondants supprimés.
    '!src/components/app-tabs.tsx',
    '!src/components/app-tabs.web.tsx',
    '!src/components/external-link.tsx',
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
