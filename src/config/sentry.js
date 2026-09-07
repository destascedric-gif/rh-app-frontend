// Doit être importé avant le rendu de <App /> pour capter les erreurs
// le plus tôt possible.
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: false, // pas d'IP/cookies par défaut (données RH sensibles)
});

export default Sentry;
