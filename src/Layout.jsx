import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout, isAdmin } = useAuth()

  const handleLogout = () => { logout(); navigate('/login'); }

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-item active' : 'nav-item'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-name">Orgaly</div>
          <div className="logo-sub">Gestion RH</div>
        </div>

        {isAdmin ? (
          <>
            <div className="nav-section">Menu</div>
            <div className={isActive('/dashboard')} onClick={() => navigate('/dashboard')}>◻ Tableau de bord</div>
            <div className={isActive('/employees')} onClick={() => navigate('/employees')}>◻ Employés</div>
            <div className={isActive('/admin/leaves')} onClick={() => navigate('/admin/leaves')}>◻ Congés</div>
            <div className={isActive('/admin/schedule')} onClick={() => navigate('/admin/schedule')}>◻ Planning</div>
            <div className={isActive('/admin/payroll')} onClick={() => navigate('/admin/payroll')}>◻ Paie</div>
          </>
        ) : (
          <>
            <div className="nav-section">Menu</div>
            <div className={isActive('/mon-espace')} onClick={() => navigate('/mon-espace')}>◻ Mon espace</div>
            <div className={isActive('/mon-planning')} onClick={() => navigate('/mon-planning')}>◻ Mon planning</div>
          </>
        )}

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
        </div>
      </div>

      <div style={{ marginLeft: 220, flex: 1, background: '#F7F5F2', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}