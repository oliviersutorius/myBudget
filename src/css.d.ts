// Déclarations ambiantes pour les imports CSS (web only — Metro/Expo Router web).
declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
