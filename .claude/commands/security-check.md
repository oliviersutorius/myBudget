---
description: Audit sécurité des dépendances et du code (agent Auditeur sécurité)
---

1. Lance `npm audit` (et `npx expo-doctor` si disponible) pour détecter les vulnérabilités connues dans les dépendances.
2. Vérifie qu'aucun secret n'est présent en clair dans le code versionné (recherche de patterns de clés API, tokens).
3. Vérifie qu'aucune modification n'a touché `*.env`, `android/keystore/**` ou `ios/certs/**` (fichiers protégés, cf. `.claude/settings.json`).
4. myBudget n'a pas de backend : pas de check OWASP Top 10 côté serveur. Concentre-toi sur le stockage sécurisé des données locales sensibles (chiffrement si nécessaire) et les permissions Android/iOS demandées par l'app (principe du moindre privilège).
5. Résume les findings par sévérité, en console.
