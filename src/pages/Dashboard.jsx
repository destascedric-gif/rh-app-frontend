import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployees, getPendingTimesheets, reviewTimesheet } from '../api/employees';
import { getAllRequests } from '../api/leaves';

export default function Dashboard() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [employees,        setEmployees]        = useState([]);
  const [leaves,            setLeaves]            = useState([]);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [reviewingId,      setReviewingId]       = useState(null);

  const load = async () => {
    try {
      const [emps, lvs, ts] = await Promise.all([
        getEmployees(token),
        getAllRequests('en_attente', token),
        getPendingTimesheets(token),
      ]);
      setEmployees(emps);
      setLeaves(lvs);
      setPendingTimesheets(ts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleReviewTimesheet = async (timesheet, status) => {
    setReviewingId(timesheet.id);
    try {
      await reviewTimesheet(timesheet.employee_id, timesheet.id, status, token);
      setPendingTimesheets((prev) => prev.filter((t) => t.id !== timesheet.id));
    } finally {
      setReviewingId(null);
    }
  };

  const actifs    = employees.filter(e => e.is_active).length;
  const enAttente = employees.filter(e => !e.invite_accepted).length;

  if (loading) return <div className="page-loading">Chargement…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre entreprise</p>
        </div>
      </div>

      {/* Métriques */}
      <div className="metrics">
        <div className="metric-card">
          <div className="metric-label">Employés actifs</div>
          <div className="metric-value">{actifs}</div>
          <div className="metric-sub">{enAttente > 0 ? `${enAttente} invitation(s) en attente` : 'Tous actifs'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Congés en attente</div>
          <div className="metric-value" style={{ color: leaves.length > 0 ? '#B45309' : 'inherit' }}>
            {leaves.length}
          </div>
          <div className="metric-sub">{leaves.length > 0 ? 'À traiter' : 'Aucune demande'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total employés</div>
          <div className="metric-value">{employees.length}</div>
          <div className="metric-sub">Dans l'équipe</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pointages en attente</div>
          <div className="metric-value" style={{ color: pendingTimesheets.length > 0 ? '#B45309' : 'inherit' }}>
            {pendingTimesheets.length}
          </div>
          <div className="metric-sub">{pendingTimesheets.length > 0 ? 'À valider' : 'Aucune demande'}</div>
        </div>
      </div>

      {/* Demandes de congés en attente */}
      {leaves.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-header">
            <span className="section-title">Demandes de congés en attente</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/admin/leaves')}>Voir tout</button>
          </div>
          <div className="table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Du</th>
                  <th>Au</th>
                  <th>Jours</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leaves.slice(0, 5).map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="cell-emp">
                        <div className="avatar-xs">{l.employee_name?.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <div className="emp-name">{l.employee_name}</div>
                          <div className="emp-email">{l.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{l.leave_type}</td>
                    <td>{new Date(l.start_date).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(l.end_date).toLocaleDateString('fr-FR')}</td>
                    <td><strong>{l.working_days} j</strong></td>
                    <td>
                      <button className="btn-primary btn-sm" onClick={() => navigate('/admin/leaves')}>
                        Traiter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pointages en attente de validation */}
      {pendingTimesheets.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-header">
            <span className="section-title">Pointages en attente</span>
          </div>
          <div className="table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Date</th>
                  <th>Arrivée</th>
                  <th>Départ</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingTimesheets.slice(0, 5).map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="cell-emp">
                        <div className="avatar-xs">{t.employee_name?.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <div className="emp-name">{t.employee_name}</div>
                          <div className="emp-email">{t.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                    <td>{t.clock_in ? t.clock_in.slice(0, 5) : '—'}</td>
                    <td>{t.clock_out ? t.clock_out.slice(0, 5) : '—'}</td>
                    <td><strong>{t.total_hours ? `${t.total_hours} h` : '—'}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-primary btn-sm"
                          disabled={reviewingId === t.id}
                          onClick={() => handleReviewTimesheet(t, 'validé')}
                        >
                          Valider
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          disabled={reviewingId === t.id}
                          onClick={() => handleReviewTimesheet(t, 'refusé')}
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liste employés récents */}
      <div>
        <div className="section-header">
          <span className="section-title">Équipe</span>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/employees')}>Voir tout</button>
        </div>
        <div className="table-wrap">
          <table className="rh-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Poste</th>
                <th>Contrat</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map(emp => (
                <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="cell-emp">
                      <div className="avatar-xs">{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                      <div>
                        <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                        <div className="emp-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.job_title ?? '—'}</td>
                  <td>{emp.contract_type ?? '—'}</td>
                  <td>
                    <span className={`badge ${emp.invite_accepted ? 'badge-active' : 'badge-pending'}`}>
                      {emp.invite_accepted ? 'Actif' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}