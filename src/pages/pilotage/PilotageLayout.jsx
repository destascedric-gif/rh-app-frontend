import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../../components/BrandMark';
import { Icon } from './PilotageUi';
import './Pilotage.css';

// Cadre des pages de pilotage : menu à gauche (comme Shopify), page à droite
const NAV = [
  { to: '/pilotage', end: true, icon: 'home', label: 'Tableau de bord' },
  { to: '/pilotage/entreprises', icon: 'store', label: 'Entreprises' },
  { to: '/pilotage/formules', icon: 'crown', label: 'Formules et revenus' },
  { to: '/pilotage/ia', icon: 'spark', label: 'Intelligence artificielle' },
  { to: '/pilotage/visites', icon: 'eye', label: 'Visites du site' },
  { to: '/pilotage/journal', icon: 'list', label: 'Journal des actions' },
  { to: '/pilotage/sante', icon: 'pulse', label: 'Santé technique' },
];

export default function PilotageLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { document.title = 'Pilotage — Orgaly'; }, []);
  // Les visites de Cédric sur le site ne sont pas comptées sur cet appareil
  useEffect(() => { try { localStorage.setItem('orgaly_no_track', '1'); } catch { /* stockage indisponible */ } }, []);
  // Chaque page s'ouvre en haut
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="pil pil-shell">
      <aside className="pil-side">
        <div className="pil-brand">
          <BrandMark size={26} color="#C9A75A" />
          <div>
            <div className="pil-title">Pilotage</div>
            <div className="pil-hello">Orgaly</div>
          </div>
        </div>
        <nav className="pil-nav" aria-label="Pilotage">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `pil-nav-link${isActive ? ' on' : ''}`}>
              <Icon name={n.icon} size={16} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="pil-side-foot">
          <div className="pil-hello">Bonjour {user?.firstName || 'Cédric'}</div>
          <button type="button" className="pil-nav-link pil-logout-link" onClick={handleLogout}>
            <Icon name="logout" size={16} />Se déconnecter
          </button>
        </div>
      </aside>
      <main className="pil-main">
        <div className="pil-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
