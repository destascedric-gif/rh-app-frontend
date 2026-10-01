import { useSyncExternalStore } from 'react';

// Vrai tant que la requête média CSS correspond (ex. '(max-width: 640px)'),
// et se met à jour quand la fenêtre change de taille ou d'orientation.
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Même seuil que les règles « téléphone » de global.css
export const PHONE_QUERY = '(max-width: 640px)';
