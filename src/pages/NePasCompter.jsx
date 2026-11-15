import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Page « Ne pas compter cet appareil » (15 nov. 2026) : à ouvrir une fois
// dans chaque navigateur de Cédric où il ne se connecte pas (navigateur
// intégré d'Instagram, autre téléphone…). Ses visites ne sont plus comptées
// dans le pilotage, et celles du jour sont retirées. Les navigateurs où
// quelqu'un s'est connecté à Orgaly ne sont déjà plus comptés.
export default function NePasCompter() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('orgaly_no_track', '1'); } catch { /* stockage indisponible */ }
    fetch(`${API}/visits/forget`, { method: 'POST' })
      .catch(() => {})
      .finally(() => setDone(true));
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="success-icon">✓</div>
        <h1>Appareil exclu des visites</h1>
        <p>
          {done
            ? 'Les visites de ce navigateur ne sont plus comptées dans les statistiques d’Orgaly, et celles d’aujourd’hui ont été retirées.'
            : 'Un instant…'}
        </p>
        <p className="auth-subtitle">À refaire seulement si vous effacez les données de ce navigateur.</p>
        <p className="auth-switch"><Link to="/">Aller à l’accueil</Link></p>
      </div>
    </div>
  );
}
