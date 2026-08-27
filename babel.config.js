module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // Permet d'importer les fichiers .sql des migrations Drizzle
    // (drizzle/migrations.js) comme des chaînes de caractères — voir
    // https://orm.drizzle.team/docs/get-started/expo-new
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
