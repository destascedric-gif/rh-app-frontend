import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyBalance, getMyRequests, markAllRead, getNotifications } from '../api/leaves';
import LeaveBalanceCard  from '../components/leaves/LeaveBalanceCard';
import LeaveRequestForm  from '../components/leaves/LeaveRequestForm';
import LeaveStatusBadge  from '../components/leaves/LeaveStatusBadge';

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function MyLeaves() {
  const { token } = useAuth();

  const [balances,      setBalances]      = useState({});
  const [requests,      setRequests]      = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showForm,      setShowForm]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [balanceWarning, setBalanceWarning] = useState(null); // { available, requested }

  const load = async () => {
    try {
      const [bal, reqs, notifs] = await Promise.all([
        getMyBalance(token),
        getMyRequests(token),
        getNotifications(token),
      ]);
      setBalances(bal.balances);
      setRequests(reqs);
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleSuccess = async (data) => {
    setShowForm(false);
    setBalanceWarning(data.balanceWarning || null);
    await load();
  };

  const handleMarkRead = async () => {
    await markAllRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div className="page-loading">Chargement…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mes congés</h1>
          <p className="page-subtitle">Suivez vos soldes et gérez vos demandes</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nouvelle demande
        </button>
      </div>

      {/* Formulaire de demande */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <LeaveRequestForm
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {balanceWarning && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'var(--warning-bg)', border: '1px solid #FDE68A',
          borderRadius: 10, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: 'var(--warning)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
          }}>!</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--warning)', marginBottom: 2 }}>
              Solde insuffisant
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Demande envoyée malgré tout — <strong style={{ color: 'var(--text)' }}>{balanceWarning.available} j</strong> disponible(s)
              {' '}pour <strong style={{ color: 'var(--text)' }}>{balanceWarning.requested} j</strong> demandé(s).
              L'administrateur pourra tout de même l'approuver.
            </div>
          </div>
          <button
            onClick={() => setBalanceWarning(null)}
            style={{ background: 'none', border: 'none', color: 'var(--warning)', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 0 }}
            aria-label="Fermer"
          >×</button>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="leave-notifications">
          <div className="leave-notifications-head">
            <span className="leave-notifications-title">
              Notifications
              {unreadCount > 0 && <span className="leave-notifications-count">{unreadCount}</span>}
            </span>
            {unreadCount > 0 && (
              <button className="btn-ghost btn-sm" onClick={handleMarkRead}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="leave-notifications-list">
            {notifications.slice(0, 3).map((n) => {
              const isRefused  = n.message.startsWith('❌');
              const isApproved = n.message.startsWith('✅');
              const message = n.message.replace(/^(✅|❌)\s*/, '');
              return (
                <div key={n.id} className={`leave-notif-row${n.is_read ? '' : ' unread'}`}>
                  <span className={`leave-notif-dot${isApproved ? ' success' : isRefused ? ' danger' : ''}`} />
                  <span className="leave-notif-message">{message}</span>
                  <span className="leave-notif-date">{formatDate(n.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Soldes */}
      <section>
        <h2>Mes soldes {new Date().getFullYear()}</h2>
        <div className="balance-grid">
          {Object.entries(balances).map(([type, { balance_days, used_days }]) => (
            <LeaveBalanceCard
              key={type}
              leaveType={type}
              balanceDays={balance_days}
              usedDays={used_days}
            />
          ))}
        </div>
      </section>

      {/* Historique des demandes */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Mes demandes</h2>
        {requests.length === 0 ? (
          <p className="empty-state">Aucune demande pour le moment.</p>
        ) : (
          <table className="rh-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Du</th>
                <th>Au</th>
                <th>Jours</th>
                <th>Statut</th>
                <th>Note admin</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.leave_type}</td>
                  <td>{formatDate(r.start_date)}</td>
                  <td>{formatDate(r.end_date)}</td>
                  <td>{r.working_days} j</td>
                  <td><LeaveStatusBadge status={r.status} /></td>
                  <td className="text-muted">{r.admin_note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
