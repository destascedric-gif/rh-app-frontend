import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminSchedule, createShift, deleteShift } from '../api/schedule';
import { getMeetings } from '../api/meetings';
import { getEmployees } from '../api/employees';
import { getShiftTemplates } from '../api/shiftTemplates';
import WeekView, { getWeekDays, toISO } from '../components/schedule/WeekView';
import MonthView from '../components/schedule/MonthView';
import ShiftModal from '../components/schedule/ShiftModal';
import MeetingModal from '../components/schedule/MeetingModal';
import ScheduleLegend from '../components/schedule/ScheduleLegend';
import TemplatePalette from '../components/schedule/TemplatePalette';
import PhoneCalendar from '../components/schedule/PhoneCalendar';
import EmployeeMultiSelect from '../components/EmployeeMultiSelect';
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

export default function AdminSchedule() {
  const { token } = useAuth();

  const [view,        setView]        = useState('week');
  // Sur téléphone, toujours le calendrier du mois (façon agenda)
  const isPhone   = useMediaQuery(PHONE_QUERY);
  const shownView = isPhone ? 'month' : view;
  const [monday,      setMonday]      = useState(getMondayOfWeek());
  const [monthDate,   setMonthDate]   = useState(new Date());
  const [employees,   setEmployees]   = useState([]);
  const [templates,   setTemplates]   = useState([]);
  const [shifts,      setShifts]      = useState([]);
  const [meetings,    setMeetings]    = useState([]);
  // Employés affichés (aucun choisi = tout le monde)
  const [filteredIds, setFilteredIds] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [meetingModal, setMeetingModal] = useState(null);

  useEffect(() => {
    getEmployees(token).then(setEmployees).catch(console.error);
    getShiftTemplates(token).then(setTemplates).catch(console.error);
  }, [token]);

  const getDateRange = useCallback(() => {
    if (shownView === 'week') {
      const days = getWeekDays(monday);
      return { start: toISO(days[0]), end: toISO(days[6]) };
    }
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    return {
      start: toISO(new Date(y, m, 1)),
      end:   toISO(new Date(y, m + 1, 0)),
    };
  }, [shownView, monday, monthDate]);

  // Tous les créneaux de la période : le filtre par employé se fait à
  // l'affichage, pour pouvoir en choisir plusieurs.
  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const [data, meets] = await Promise.all([
        getAdminSchedule(start, end, null, token),
        getMeetings(start, end, token),
      ]);
      setShifts(data);
      setMeetings(meets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, token]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const prevWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const prevMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  const handleDelete = async (shift) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await deleteShift(shift.id, token);
      setShifts(prev => prev.filter(s => s.id !== shift.id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Un créneau enregistré remplace celui du même employé le même jour
  const handleSaved = (saved) => {
    setShifts(prev => [
      ...prev.filter(s => s.id !== saved.id
        && !(s.user_id === saved.user_id && s.date?.slice(0, 10) === saved.date?.slice(0, 10))),
      saved,
    ]);
  };

  const handleMeetingSaved = (saved) => {
    setMeetings(prev => [...prev.filter(m => m.id !== saved.id), saved]);
  };

  const handleMeetingDeleted = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  // Dépose d'un horaire type sur une case du planning : crée le créneau
  // directement avec les horaires du modèle, sans passer par la fenêtre de
  // création (choix du client — la rapidité prime sur la confirmation).
  const handleTemplateDrop = async (userId, date, template) => {
    try {
      // "Repos" glissé : jour entier non travaillé (mêmes bornes qu'un congé)
      if (template.kind === 'repos') {
        const saved = await createShift(
          { userId, date, startTime: '00:00', endTime: '23:59', breaks: [], type: 'repos' },
          token
        );
        handleSaved(saved);
        return;
      }
      const breaks = template.break_start
        ? [{ start_time: template.break_start, end_time: template.break_end, label: 'Pause' }]
        : [];
      const saved = await createShift(
        { userId, date, startTime: template.start_time, endTime: template.end_time, breaks, type: 'travail' },
        token
      );
      handleSaved(saved);
    } catch (err) {
      alert(err.message);
    }
  };

  const weekDays = getWeekDays(monday);
  const range = getDateRange();

  const displayedEmployees = filteredIds.length > 0
    ? employees.filter(e => filteredIds.includes(e.id))
    : employees;

  // Date proposée pour une nouvelle réunion : aujourd'hui s'il est affiché
  const defaultMeetingDate = () => {
    const today = toISO(new Date());
    return today >= range.start && today <= range.end ? today : range.start;
  };

  return (
    <div className="page">
      <PageHeader
        title="Planning"
        actions={(
          <>
            <button className="btn-secondary" onClick={() => setMeetingModal({ date: defaultMeetingDate() })}>+ Réunion</button>
            <button className="btn-primary" onClick={() => setModal({})}>+ Nouveau créneau</button>
          </>
        )}
      />

      <div className="schedule-toolbar">
        <div className="schedule-filter">
          <EmployeeMultiSelect
            employees={employees}
            value={filteredIds}
            onChange={setFilteredIds}
            allLabel="Tous les employés"
            emptyMeansAll
          />
        </div>

        <div className="schedule-nav">
          <button className="btn-ghost" onClick={shownView === 'week' ? prevWeek : prevMonth}>←</button>
          <span className="schedule-period">
            {shownView === 'week'
              ? `${weekDays[0].getDate()} ${MONTH_NAMES[weekDays[0].getMonth()]} → ${weekDays[6].getDate()} ${MONTH_NAMES[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
              : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
            }
          </span>
          <button className="btn-ghost" onClick={shownView === 'week' ? nextWeek : nextMonth}>→</button>
          <button className="btn-ghost" onClick={() => { setMonday(getMondayOfWeek()); setMonthDate(new Date()); }}>
            Aujourd'hui
          </button>
        </div>

        {!isPhone && <div className="role-toggle">
          <button className={`role-btn ${view==='week'?'active':''}`} onClick={() => setView('week')}>Semaine</button>
          <button className={`role-btn ${view==='month'?'active':''}`} onClick={() => setView('month')}>Mois</button>
        </div>}
      </div>

      <ScheduleLegend templates={templates} />
      {shownView === 'week' && <TemplatePalette templates={templates} />}

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : isPhone ? (
        <PhoneCalendar
          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
          isAdmin
          selectedUserIds={filteredIds}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onAddShift={(date) => setModal({ date })}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
        />
      ) : view === 'week' ? (
        <WeekView
          days={weekDays}
          shifts={shifts}
          meetings={meetings}
          employees={displayedEmployees}
          isAdmin={true}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onTemplateDrop={handleTemplateDrop}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
        />
      ) : (
        <MonthView
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
          isAdmin={true}
          selectedUserIds={filteredIds}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
        />
      )}

      {modal !== null && (
        <ShiftModal
          shift={modal.shift}
          date={modal.date}
          userId={modal.userId}
          employees={employees}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {meetingModal !== null && (
        <MeetingModal
          meeting={meetingModal.meeting}
          date={meetingModal.date}
          employees={employees.filter(e => e.is_active)}
          shifts={shifts}
          range={range}
          onClose={() => setMeetingModal(null)}
          onSaved={handleMeetingSaved}
          onDeleted={handleMeetingDeleted}
        />
      )}
    </div>
  );
}
