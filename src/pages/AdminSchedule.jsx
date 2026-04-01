import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminSchedule, deleteShift } from '../api/schedule';
import { getEmployees } from '../api/employees';
import WeekView, { getWeekDays, toISO } from '../components/schedule/WeekView';
import MonthView from '../components/schedule/MonthView';
import ShiftModal from '../components/schedule/ShiftModal';

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
  const [monday,      setMonday]      = useState(getMondayOfWeek());
  const [monthDate,   setMonthDate]   = useState(new Date());
  const [employees,   setEmployees]   = useState([]);
  const [shifts,      setShifts]      = useState([]);
  const [filteredEmp, setFilteredEmp] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);

  useEffect(() => {
    getEmployees(token).then(setEmployees).catch(console.error);
  }, [token]);

  const getDateRange = useCallback(() => {
    if (view === 'week') {
      const days = getWeekDays(monday);
      return { start: toISO(days[0]), end: toISO(days[6]) };
    }
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    return {
      start: toISO(new Date(y, m, 1)),
      end:   toISO(new Date(y, m + 1, 0)),
    };
  }, [view, monday, monthDate]);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const data = await getAdminSchedule(start, end, filteredEmp || null, token);
      setShifts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, filteredEmp, token]);

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

  const handleSaved = (saved) => {
    setShifts(prev => {
      const exists = prev.find(s => s.id === saved.id);
      return exists
        ? prev.map(s => s.id === saved.id ? saved : s)
        : [...prev, saved];
    });
  };

  const weekDays = getWeekDays(monday);

  const displayedEmployees = filteredEmp
    ? employees.filter(e => e.id === filteredEmp)
    : employees;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Planning</h1>
          <p className="page-subtitle">Gérez les horaires de votre équipe</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          + Nouveau créneau
        </button>
      </div>

      <div className="schedule-toolbar">
        {/* Select employé stylisé */}
        <select
          value={filteredEmp}
          onChange={e => setFilteredEmp(e.target.value)}
        >
          <option value="">Tous les employés</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
          ))}
        </select>

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

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : view === 'week' ? (
        <WeekView
          days={weekDays}
          shifts={shifts}
          employees={displayedEmployees}
          isAdmin={true}
          onCellClick={(cell) => setModal(cell)}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
        />
      ) : (
        <MonthView
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          employees={displayedEmployees}
          isAdmin={true}
          selectedUserId={filteredEmp}
          onCellClick={(cell) => setModal(cell)}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
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
    </div>
  );
}