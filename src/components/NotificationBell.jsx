import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, getNotifications, markAllRead } from '../api/leaves';
import { getPendingTimesheets } from '../api/employees';

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// Événement émis par notifyRequestsChanged() (utils/notifications.js)
const NOTIFICATIONS_CHANGED = 'orgaly:notifications-changed';

// Cloche de la barre du haut, reliée aux vraies données :
// - gérant : demandes de congé et pointages en attente de décision ;
// - employé : réponses à ses demandes de congé (notifications non lues).
// Rechargée à chaque changement de page, pour refléter les actions faites.
export default function NotificationBell() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const wrapRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);   // { key, label, to }
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Une page qui traite une demande (ex. le tableau de bord) le signale
  // pour que le compteur se mette à jour sans changer de page.
  useEffect(() => {
    const onRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(NOTIFICATIONS_CHANGED, onRefresh);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onRefresh);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const load = isAdmin
      ? Promise.all([getAllRequests('en_attente', token), getPendingTimesheets(token)])
        .then(([leaves, timesheets]) => {
          const list = [];
          if (leaves.length) list.push({ key: 'leaves', label: `${plural(leaves.length, 'demande de congé', 'demandes de congé')} à traiter`, to: '/admin/leaves' });
          if (timesheets.length) list.push({ key: 'ts', label: `${plural(timesheets.length, 'pointage', 'pointages')} à valider`, to: '/dashboard' });
          return { list, total: leaves.length + timesheets.length };
        })
      : getNotifications(token).then((notifs) => ({
        list: notifs.slice(0, 6).map((n) => ({ key: n.id, label: n.message, to: '/mes-conges', unread: !n.is_read })),
        total: notifs.filter((n) => !n.is_read).length,
      }));

    load
      .then(({ list, total }) => { if (!cancelled) { setItems(list); setCount(total); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, isAdmin, location.pathname, refreshKey]);

  // Fermeture au clic à l'extérieur ou avec Échap
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Employé : ouvrir la liste vaut lecture des notifications
    if (next && !isAdmin && count > 0) {
      markAllRead(token).then(() => setCount(0)).catch(() => {});
    }
  };

  const goTo = (to) => { setOpen(false); navigate(to); };

  return (
    <div className="bell" ref={wrapRef}>
      <button
        type="button"
        className="bell-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count ? `Notifications : ${count} en attente` : 'Notifications'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 && <span className="bell-count">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="menu">
          {items.length === 0 ? (
            <p className="bell-empty">Rien en attente pour le moment.</p>
          ) : items.map((item) => (
            <button key={item.key} type="button" role="menuitem" className={`bell-item${item.unread ? ' bell-item--unread' : ''}`} onClick={() => goTo(item.to)}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
