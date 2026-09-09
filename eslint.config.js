// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', 'node_modules/*', 'coverage/*', '.expo/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // expo-notifications plante Expo Go dès son import statique (retiré du
    // SDK 53, voir docs/technique/preview.md) — src/utils/notifications-module.ts
    // (exempté ci-dessous) est le seul point d'entrée autorisé (require()
    // différé, jamais un import statique). Empêche mécaniquement la
    // régression qui a déjà cassé Expo Go une première fois (#14/#19).
    // `import type` reste autorisé partout (allowTypeImports) : erasé à la
    // compilation, aucun effet à l'exécution.
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-notifications',
              message:
                "N'importez pas expo-notifications directement (plante Expo Go) — passez par chargerModuleNotifications() dans src/utils/notifications-module.ts.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/utils/notifications-module.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
]);
