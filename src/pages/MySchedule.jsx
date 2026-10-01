import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMySchedule } from '../api/schedule';
import { getMeetings } from '../api/meetings';
import WeekView, { getWeekDays, toISO } from '../components/schedule/WeekView';
import MonthView from '../components/schedule/MonthView';
import ScheduleLegend from '../components/schedule/ScheduleLegend';
import { getShiftTemplates } from '../api/shiftTemplates';
import PhoneCalendar from '../components/schedule/PhoneCalendar';
import PhoneWeekList from '../components/schedule/PhoneWeekList';
import useMediaQuery, { PHONE_QUERY } from '../utils/useMediaQuery';
import PageHeader from '../components/PageHeader';

const getMondayOfWeek = (date = new Date()) => {
  const d   = new Date(date);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
};

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function MySchedule() {
  const { token } = useAuth();

  // Sur téléphone, le calendrier du mois (façon agenda) s'ouvre par défaut ;
  // la semaine reste disponible, en cartes détaillées.
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [view,      setView]      = useState(() => (window.matchMedia(PHONE_QUERY).matches ? 'month' : 'week'));
  const [monday,    setMonday]    = useState(getMondayOfWeek());
  const [monthDate, setMonthDate] = useState(new Date());
  const [shifts,    setShifts]    = useState([]);
  const [meetings,  setMeetings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [templates, setTemplates] = useState([]);

  // Horaires types de l'entreprise : uniquement pour la légende des couleurs
  useEffect(() => {
    getShiftTemplates(token).then(setTemplates).catch(() => {});
  }, [token]);

  // Résumé semaine
  const weekDays   = getWeekDays(monday);
  const weekShifts = shifts.filter(s => {
    const d = s.date?.slice(0, 10);
    return d >= toISO(weekDays[0]) && d <= toISO(weekDays[6]);
  });
  // Seuls les créneaux de travail comptent comme des heures effectives —
  // un jour de congé/repos/absence n'est pas du temps travaillé, même si
  // le créneau s'étend sur toute la journée pour l'affichage au planning.
  const workShifts = weekShifts.filter(s => !s.type || s.type === 'travail');
  const weekHours  = workShifts.reduce((sum, s) => sum + (s.net_hours ?? 0), 0);

  const getDateRange = useCallback(() => {
    if (view === 'week') {
      const days = getWeekDays(monday);
      return { start: toISO(days[0]), end: toISO(days[6]) };
    }
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    return { start: toISO(new Date(y, m, 1)), end: toISO(new Date(y, m + 1, 0)) };
  }, [view, monday, monthDate]);

  useEffect(() => {
    setLoading(true);
    const { start, end } = getDateRange();
    Promise.all([getMySchedule(start, end, token), getMeetings(start, end, token)])
      .then(([sched, meets]) => { setShifts(sched); setMeetings(meets); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getDateRange, token]);

  const prevWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const prevMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  return (
    <div className="page">
      <PageHeader title="Mon planning" />

      {/* Résumé semaine */}
      {/* Téléphone : résumé de la semaine en une ligne */}
      {view === 'week' && isPhone && (
        <p className="week-summary">
          <strong>{workShifts.length}</strong> jour{workShifts.length > 1 ? 's' : ''} travaillé{workShifts.length > 1 ? 's' : ''}
          {' · '}<strong>{weekHours.toFixed(1)} h</strong> nettes
        </p>
      )}

      {view === 'week' && !isPhone && (
        <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))', marginBottom: '1rem' }}>
          <div className="metric-card">
            <div className="metric-label">Jours planifiés cette semaine</div>
            <div className="metric-value">{weekShifts.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Heures nettes cette semaine</div>
            <div className="metric-value">{weekHours.toFixed(1)} h</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Jours sans créneau</div>
            <div className="metric-value">{7 - weekShifts.length}</div>
          </div>
        </div>
      )}

      {/* Barre de navigation */}
      <div className="schedule-toolbar">
        <div className="schedule-nav">
          <button className="btn-ghost" onClick={view === 'week' ? prevWeek : prevMonth}>←</button>
          <span className="schedule-period">
            {view === 'week'
              ? `${weekDays[0].getDate()} ${MONTH_NAMES[weekDays[0].getMonth()]} → ${weekDays[6].getDate()} ${MONTH_NAMES[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
              : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
            }
          </span>
          <button className="btn-ghost" onClick={view === 'week' ? nextWeek : nextMonth}>→</button>
          <button className="btn-ghost" onClick={() => { setMonday(getMondayOfWeek()); setMonthDate(new Date()); }}>
            Aujourd'hui
          </button>
        </div>

        <div className="role-toggle">
          <button className={`role-btn ${view==='week'?'active':''}`} onClick={() => setView('week')}>Semaine</button>
          <button className={`role-btn ${view==='month'?'active':''}`} onClick={() => setView('month')}>Mois</button>
        </div>
      </div>

      <ScheduleLegend templates={templates} />

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : isPhone && view === 'week' ? (
        <PhoneWeekList days={weekDays} shifts={shifts} meetings={meetings} />
      ) : isPhone ? (
        <PhoneCalendar
          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
        />
      ) : view === 'week' ? (
        <WeekView
          days={weekDays}
          shifts={shifts}
          meetings={meetings}
          isAdmin={false}
        />
      ) : (
        <MonthView
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
          isAdmin={false}
        />
      )}
    </div>
  );
}
