import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployees, getPendingTimesheets, reviewTimesheet } from '../api/employees';
import { getAllRequests, reviewRequest } from '../api/leaves';
import { getAdminSchedule } from '../api/schedule';
import { getWeekDays, toISO } from '../components/schedule/WeekView';
import { shiftColorVar } from '../components/schedule/shiftColor';
import PageHeader from '../components/PageHeader';
import { notifyRequestsChanged } from '../utils/notifications';

const TYPE_LABELS = { conge: 'Congé', repos: 'Repos', absence: 'Absence' };

const getMonday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

// "08:30:00" → "8h30"
const shortTime = (t) => {
  const [h, m] = t.slice(0, 5).split(':');
  return `${Number(h)}h${m}`;
};
const shortDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const initials = (name = '') => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const Metric = ({ icon, tone, value, label, sub }) => (
  <div className="metric-card metric-card--icon">
    <div className={`metric-icon metric-icon--${tone}`} aria-hidden="true">{icon}</div>
    <div className="metric-value">{value}</div>
    <div className="metric-label-strong">{label}</div>
    {sub && <div className="metric-sub">{sub}</div>}
  </div>
);

const svg = (paths) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

export default function Dashboard() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [employees,  setEmployees]  = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [weekShifts, setWeekShifts] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [busyId,     setBusyId]     = useState(null);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    try {
      const days = getWeekDays(getMonday());
      const [emps, lvs, ts, shifts] = await Promise.all([
        getEmployees(token),
        getAllRequests('en_attente', token),
        getPendingTimesheets(token),
        getAdminSchedule(toISO(days[0]), toISO(days[6]), null, token),
      ]);
      setEmployees(emps);
      setLeaves(lvs);
      setTimesheets(ts);
      setWeekShifts(shifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Valider / refuser directement depuis le tableau de bord
  const decideLeave = async (leave, status) => {
    if (status === 'refusé' && !confirm(`Refuser la demande de ${leave.employee_name} ?`)) return;
    setBusyId(leave.id);
    setError('');
    try {
      await reviewRequest(leave.id, { status }, token);
      setLeaves((prev) => prev.filter((l) => l.id !== leave.id));
      notifyRequestsChanged();
      if (status === 'approuvé') load(); // le congé apparaît dans le planning
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const decideTimesheet = async (ts, status) => {
    setBusyId(ts.id);
    setError('');
    try {
      await reviewTimesheet(ts.employee_id, ts.id, status, token);
      setTimesheets((prev) => prev.filter((t) => t.id !== ts.id));
      notifyRequestsChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page-loading">Chargement…</div>;

  const actifs   = employees.filter((e) => e.is_active);
  const invites  = actifs.filter((e) => !e.invite_accepted).length;
  const weekHours = weekShifts
    .filter((s) => (s.type || 'travail') === 'travail')
    .reduce((sum, s) => sum + (s.net_hours ?? 0), 0);

  const todayStr = toISO(new Date());
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayRows = actifs.map((emp) => ({
    emp,
    shift: weekShifts.find((s) => s.user_id === emp.id && s.date?.slice(0, 10) === todayStr),
  }));

  // Congés puis pointages, dans une seule liste
  const requests = [
    ...leaves.map((l) => ({
      key: `l-${l.id}`, name: l.employee_name,
      detail: `${l.leave_type} · ${shortDate(l.start_date)}${l.end_date !== l.start_date ? ` → ${shortDate(l.end_date)}` : ''} · ${Number(l.working_days)} j`,
      busy: busyId === l.id,
      onAccept: () => decideLeave(l, 'approuvé'),
      onRefuse: () => decideLeave(l, 'refusé'),
    })),
    ...timesheets.map((t) => ({
      key: `t-${t.id}`, name: t.employee_name,
      detail: `Pointage · ${shortDate(t.date)} · ${t.clock_in ? shortTime(t.clock_in) : '?'} – ${t.clock_out ? shortTime(t.clock_out) : '?'}`,
      busy: busyId === t.id,
      onAccept: () => decideTimesheet(t, 'validé'),
      onRefuse: () => decideTimesheet(t, 'refusé'),
    })),
  ];

  return (
    <div className="page">
      <PageHeader title="Tableau de bord" />

      <div className="metrics">
        <Metric tone="blue" value={actifs.length} label="Employés actifs"
          sub={invites > 0 ? `dont ${invites} invitation${invites > 1 ? 's' : ''} en attente` : null}
          icon={svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="18" cy="9" r="2.6" /><path d="M15.3 14.1c2.7.4 4.7 2.8 4.7 5.9" /></>)} />
        <Metric tone="amber" value={leaves.length} label="Congés en attente"
          icon={svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>)} />
        <Metric tone="amber" value={timesheets.length} label="Pointages à valider"
          icon={svg(<><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>)} />
        <Metric tone="grey" value={`${Math.round(weekHours)} h`} label="Heures planifiées cette semaine"
          icon={svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>)} />
      </div>

      {error && <div className="notif-bar notif-bar--danger">{error}</div>}

      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Planning du jour</h2>
            <span className="dash-card-meta">{todayLabel}</span>
          </div>
          {todayRows.length === 0 ? (
            <p className="dash-empty">Aucun employé pour le moment.</p>
          ) : (
            <ul className="dash-list">
              {todayRows.map(({ emp, shift }) => {
                const type = shift ? (shift.type || 'travail') : null;
                return (
                  <li key={emp.id} className="dash-row">
                    <span className="dash-avatar">
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </span>
                    <span className="dash-row-main">
                      <span className="dash-row-name">{emp.first_name} {emp.last_name}</span>
                      {emp.job_title && <span className="dash-row-sub">{emp.job_title}</span>}
                    </span>
                    {type === 'travail' ? (
                      <span className="dash-chip shift-colored" style={shiftColorVar(shift)}>
                        {shortTime(shift.start_time)} – {shortTime(shift.end_time)}
                      </span>
                    ) : (
                      <span className="dash-off">{type ? TYPE_LABELS[type] : 'Pas de créneau'}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="btn-ghost btn-sm dash-link" onClick={() => navigate('/admin/schedule')}>
            Ouvrir le planning
          </button>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Demandes à traiter</h2>
          </div>
          {requests.length === 0 ? (
            <p className="dash-empty">Aucune demande en attente.</p>
          ) : (
            <ul className="dash-requests">
              {requests.map((r) => (
                <li key={r.key} className="dash-request">
                  <span className="dash-avatar dash-avatar--small">{initials(r.name)}</span>
                  <div className="dash-request-main">
                    <div className="dash-row-name">{r.name}</div>
                    <div className="dash-row-sub">{r.detail}</div>
                    <div className="dash-request-actions">
                      <button type="button" className="btn-primary btn-sm" disabled={r.busy} onClick={r.onAccept}>Valider</button>
                      <button type="button" className="btn-secondary btn-sm" disabled={r.busy} onClick={r.onRefuse}>Refuser</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
