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

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-bar">
          <div className="notif-header">
            <span>🔔 Notifications {unreadCount > 0 && <strong>({unreadCount} non lue{unreadCount > 1 ? 's' : ''})</strong>}</span>
            {unreadCount > 0 && (
              <button className="btn-ghost small" onClick={handleMarkRead}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          {notifications.slice(0, 3).map((n) => (
            <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`}>
              <span>{n.message}</span>
              <span className="text-muted">{formatDate(n.created_at)}</span>
            </div>
          ))}
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
