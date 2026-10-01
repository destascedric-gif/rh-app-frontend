import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { getSettings } from './api/settings'
import {
  DashboardIcon, EmployeesIcon, LeavesIcon, ScheduleIcon, PayrollIcon, TimesheetIcon, SettingsIcon, BillingIcon,
  HelpIcon,
} from './components/NavIcons'
import { LegalLinks } from './pages/legal/LegalLayout'
import { EDITOR } from './legal/legalInfo'

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, token, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Applique la couleur principale personnalisée par l'entreprise
  useEffect(() => {
    if (!token) return
    getSettings(token)
      .then((s) => {
        if (s.primary_color) document.documentElement.style.setProperty('--primary', s.primary_color)
      })
      .catch(() => {})
  }, [token])

  // Referme le menu mobile à chaque changement de page
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login'); }

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item'

  const go = (path) => navigate(path)

  return (
    <div className="app-layout">
      {/* Barre du haut visible uniquement sur mobile — seul point d'accès au menu quand la barre latérale est masquée */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
        <span className="mobile-topbar-title">Orgaly</span>
      </div>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-logo sidebar-logo-row">
          <div className="sidebar-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z" />
              <path d="M4 7l8 4 8-4" />
              <path d="M12 11v10" />
            </svg>
          </div>
          <div>
            <div className="logo-name">Orgaly</div>
            <div className="logo-sub">Gestion RH</div>
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="nav-section">Menu</div>
            <button className={isActive('/dashboard')} onClick={() => go('/dashboard')}><DashboardIcon /> Tableau de bord</button>
            <button className={isActive('/employees')} onClick={() => go('/employees')}><EmployeesIcon /> Employés</button>
            <button className={isActive('/admin/leaves')} onClick={() => go('/admin/leaves')}><LeavesIcon /> Congés</button>
            <button className={isActive('/admin/schedule')} onClick={() => go('/admin/schedule')}><ScheduleIcon /> Planning</button>
            <button className={isActive('/admin/payroll')} onClick={() => go('/admin/payroll')}><PayrollIcon /> Paie</button>
            <button className={isActive('/abonnement')} onClick={() => go('/abonnement')}><BillingIcon /> Abonnement</button>
            <button className={isActive('/parametres')} onClick={() => go('/parametres')}><SettingsIcon /> Paramètres</button>
          </>
        ) : (
          <>
            <div className="nav-section">Menu</div>
            <button className={isActive('/mon-espace')} onClick={() => go('/mon-espace')}><LeavesIcon /> Mon espace</button>
            <button className={isActive('/mon-planning')} onClick={() => go('/mon-planning')}><ScheduleIcon /> Mon planning</button>
            <button className={isActive('/mon-pointage')} onClick={() => go('/mon-pointage')}><TimesheetIcon /> Mon pointage</button>
          </>
        )}

        {/* Ouvre la messagerie de l'utilisateur vers l'adresse de contact d'Orgaly */}
        <a className="nav-item nav-item--help" href={`mailto:${EDITOR.email}?subject=${encodeURIComponent("Besoin d'aide sur Orgaly")}`}>
          <HelpIcon /> Besoin d'aide ?
        </a>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar-xs">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div>
              <div className="user-name" style={{ color: '#fff', fontSize: 12 }}>{user?.firstName} {user?.lastName}</div>
              <div className="user-role" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{isAdmin ? 'Administrateur' : 'Employé'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ marginTop: 10, width: '100%', padding: '7px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>
            Se déconnecter
          </button>
          <LegalLinks className="legal-links legal-links--sidebar" />
        </div>
      </div>

      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
