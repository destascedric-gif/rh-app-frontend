import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMySchedule } from '../api/schedule';
import { getMyBalance, getMyRequests } from '../api/leaves';
import { getMeetings } from '../api/meetings';
import MeetingTag from '../components/schedule/MeetingTag';
import { meetingsOn } from '../components/schedule/meetingUtils';
import { toISO } from '../components/schedule/WeekView';
import { shiftColorVar } from '../components/schedule/shiftColor';
import LeaveStatusBadge from '../components/leaves/LeaveStatusBadge';
import PageHeader from '../components/PageHeader';

// Page d'accueil de l'employé : sa journée et ses dernières demandes de
// congés, avec un lien vers les pages détaillées.

const TYPE_LABELS = { conge: 'En congé aujourd\'hui', repos: 'Repos aujourd\'hui', absence: 'Absent aujourd\'hui' };
const RECENT_REQUESTS = 3;
// Jusqu'où chercher le prochain créneau de travail
const LOOKAHEAD_DAYS = 14;

const hhmm = (t) => t?.slice(0, 5) ?? '';
const shortDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const longDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const frNumber = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
// 6.5 → "6 h 30"
const hoursLabel = (h) => {
  const total = Math.round(h * 60);
  const m = total % 60;
  return `${Math.floor(total / 60)} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`;
};

const isWork = (s) => (s.type || 'travail') === 'travail';

export default function MySpace() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [shifts,   setShifts]   = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [cpLeft,   setCpLeft]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const today = new Date();
  const todayStr = toISO(today);

  useEffect(() => {
    const end = new Date();
    end.setDate(end.getDate() + LOOKAHEAD_DAYS);
    Promise.all([
      getMySchedule(toISO(new Date()), toISO(end), token),
      getMyRequests(token),
      getMyBalance(token),
      getMeetings(toISO(new Date()), toISO(new Date()), token),
    ])
      .then(([sched, reqs, bal, meets]) => {
        setShifts(sched);
        setMeetings(meets);
        setRequests(reqs);
        const cp = bal.balances?.['Congés payés'];
        if (cp) setCpLeft(cp.balance_days - cp.used_days);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="page-loading">Chargement…</div>;

  const byTime = (a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '');
  const todayShifts = shifts.filter((s) => s.date?.slice(0, 10) === todayStr).sort(byTime);
  const todayWork = todayShifts.filter(isWork);
  const todayOff = todayShifts.find((s) => !isWork(s));
  const nextShift = shifts
    .filter((s) => isWork(s) && s.date?.slice(0, 10) > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b))[0];

  return (
    <div className="page">
      <PageHeader title="Mon espace" />

      <p className="myspace-hello">Bonjour {user?.firstName}, voici votre journée.</p>

      {error && <div className="notif-bar notif-bar--danger">{error}</div>}

      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Ma journée</h2>
            <span className="dash-card-meta">{longDate(today)}</span>
          </div>

          {todayWork.length > 0 ? (
            <ul className="myspace-shifts">
              {todayWork.map((s) => (
                <li key={s.id} className="myspace-shift shift-colored" style={shiftColorVar(s)}>
                  <span className="myspace-shift-time">{hhmm(s.start_time)} → {hhmm(s.end_time)}</span>
                  <span className="myspace-shift-sub">
                    {s.breaks?.length > 0
                      ? s.breaks.map((b) => `Pause ${hhmm(b.start_time)} – ${hhmm(b.end_time)}`).join(' · ')
                      : 'Pas de pause prévue'}
                    {s.net_hours ? ` · ${hoursLabel(s.net_hours)} de travail` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="myspace-off">
              {todayOff ? (todayOff.note || TYPE_LABELS[todayOff.type]) : 'Pas de créneau prévu aujourd\'hui.'}
            </p>
          )}

          {meetingsOn(meetings, todayStr).length > 0 && (
            <div className="myspace-meetings">
              {meetingsOn(meetings, todayStr).map((m) => (
                <div key={m.id} className="myspace-meeting">
                  <MeetingTag meeting={m} />
                  <span className="myspace-meeting-who">
                    avec {m.participants.filter((p) => p.id !== user?.id).map((p) => p.first_name).join(', ') || 'vous seul'}
                    {m.note ? ` · ${m.note}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {nextShift && (
            <p className="myspace-next">
              Prochain créneau : <strong>{longDate(nextShift.date.slice(0, 10) + 'T12:00:00')}</strong>,
              {' '}<span className="myspace-nowrap">{hhmm(nextShift.start_time)} → {hhmm(nextShift.end_time)}</span>
            </p>
          )}

          <button type="button" className="btn-ghost btn-sm dash-link" onClick={() => navigate('/mon-planning')}>
            Voir mon planning
          </button>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Mes dernières demandes</h2>
            {cpLeft !== null && (
              <span className="dash-card-meta">{frNumber(cpLeft)} j de congés payés disponibles</span>
            )}
          </div>

          {requests.length === 0 ? (
            <p className="dash-empty">Aucune demande de congé pour le moment.</p>
          ) : (
            <ul className="dash-list">
              {requests.slice(0, RECENT_REQUESTS).map((r) => (
                <li key={r.id} className="dash-row">
                  <span className="dash-row-main">
                    <span className="dash-row-name">{r.leave_type}</span>
                    <span className="dash-row-sub">
                      {shortDate(r.start_date)}
                      {r.end_date !== r.start_date ? ` → ${shortDate(r.end_date)}` : ''}
                      {' · '}{Number(r.working_days)} j
                    </span>
                  </span>
                  <LeaveStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="btn-ghost btn-sm dash-link" onClick={() => navigate('/mes-conges')}>
            Voir mes congés
          </button>
        </section>
      </div>
    </div>
  );
}
