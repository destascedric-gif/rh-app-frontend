import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Pages publiques comptées (même liste que le serveur, visits.service.js)
const PUBLIC_PATHS = new Set([
  '/', '/login', '/setup/admin', '/setup/company', '/mot-de-passe-oublie',
  '/mentions-legales', '/cgu', '/cgv', '/confidentialite', '/dpa',
  '/tarifs', '/contact', // site vitrine (16 nov. 2026)
]);

let last = { key: '', at: 0 };

// Compteur de visites (11 nov. 2026) : à chaque page publique affichée,
// prévient le serveur (page, site d'origine, ?src= des liens de Cédric).
// Aucun cookie, rien d'enregistré sur l'appareil. Ne sont pas comptés : les
// navigateurs où quelqu'un s'est connecté à Orgaly (propriétaire, gérant,
// salarié) et ceux passés par la page /ne-pas-compter.
export default function VisitTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!PUBLIC_PATHS.has(pathname)) return;
    // Pas compté : appareil exclu (pilotage ouvert, page /ne-pas-compter,
    // ou quelqu'un s'y est déjà connecté à Orgaly)
    try {
      if (localStorage.getItem('orgaly_no_track') || localStorage.getItem('rh_token')) return;
    } catch { /* stockage indisponible */ }
    // Une seule fois par page (le mode développement lance les effets deux fois)
    const key = `${pathname}${search}`;
    if (last.key === key && Date.now() - last.at < 2000) return;
    last = { key, at: Date.now() };
    const src = new URLSearchParams(search).get('src') || undefined;
    fetch(`${API}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, ref: document.referrer || undefined, src }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, search]);

  return null;
}
