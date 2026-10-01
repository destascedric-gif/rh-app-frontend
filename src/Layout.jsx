import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { getSettings } from './api/settings'
import {
  DashboardIcon, EmployeesIcon, LeavesIcon, ScheduleIcon, PayrollIcon, TimesheetIcon, SettingsIcon, BillingIcon,
  HelpIcon, LogoutIcon,
} from './components/NavIcons'
import { LegalLinks } from './pages/legal/LegalLayout'
import { EDITOR } from './legal/legalInfo'
import useTableCellLabels from './utils/useTableCellLabels'

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, token, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef(null)
  useTableCellLabels(mainRef)

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
          <div className="logo-name">Orgaly</div>
        </div>

        {isAdmin ? (
          <>
            <button className={isActive('/dashboard')} onClick={() => go('/dashboard')}><DashboardIcon /> Tableau de bord</button>
            <button className={isActive('/admin/schedule')} onClick={() => go('/admin/schedule')}><ScheduleIcon /> Planning</button>
            <button className={isActive('/admin/leaves')} onClick={() => go('/admin/leaves')}><LeavesIcon /> Congés et absences</button>
            <button className={isActive('/admin/payroll')} onClick={() => go('/admin/payroll')}><PayrollIcon /> Paie</button>
            <button className={isActive('/employees')} onClick={() => go('/employees')}><EmployeesIcon /> Équipe</button>
          </>
        ) : (
          <>
            <button className={isActive('/mon-espace')} onClick={() => go('/mon-espace')}><LeavesIcon /> Mon espace</button>
            <button className={isActive('/mon-planning')} onClick={() => go('/mon-planning')}><ScheduleIcon /> Mon planning</button>
            <button className={isActive('/mon-pointage')} onClick={() => go('/mon-pointage')}><TimesheetIcon /> Mon pointage</button>
          </>
        )}

        {/* Réglages et aide, séparés des pages de travail, en bas du menu */}
        <div className="nav-bottom">
          {isAdmin && (
            <>
              <button className={isActive('/abonnement')} onClick={() => go('/abonnement')}><BillingIcon /> Abonnement</button>
              <button className={isActive('/parametres')} onClick={() => go('/parametres')}><SettingsIcon /> Paramètres</button>
            </>
          )}
          {/* Ouvre la messagerie de l'utilisateur vers l'adresse de contact d'Orgaly */}
          <a className="nav-item nav-item--help" href={`mailto:${EDITOR.email}?subject=${encodeURIComponent("Besoin d'aide sur Orgaly")}`}>
            <HelpIcon /> Besoin d'aide ?
          </a>
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div className="user-chip-text">
              <div className="user-name">{user?.firstName} {user?.lastName}</div>
              <div className="user-role">{isAdmin ? 'Administrateur' : 'Employé'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter"><LogoutIcon /></button>
          </div>
          <LegalLinks className="legal-links legal-links--sidebar" />
        </div>
      </div>

      <div className="main-content" ref={mainRef}>
        {children}
      </div>
    </div>
  )
}
