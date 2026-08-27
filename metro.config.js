const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permet d'importer les fichiers .sql générés par `drizzle-kit generate`
// (driver "expo") depuis drizzle/migrations.js — voir
// https://orm.drizzle.team/docs/get-started/expo-new
config.resolver.sourceExts.push('sql');

module.exports = config;
