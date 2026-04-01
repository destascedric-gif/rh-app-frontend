import ShiftCard from './ShiftCard';

export const getWeekDays = (monday) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
};

export const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formatDayHeader = (date) => {
  const day     = DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const num     = date.getDate();
  const isToday = toISO(date) === toISO(new Date());
  return { day, num, isToday };
};

export default function WeekView({ days, shifts, employees, isAdmin, onCellClick, onShiftClick, onShiftDelete }) {
  const getShiftForUserAndDay = (userId, dateStr) =>
    shifts.find(s => s.user_id === userId && s.date?.slice(0, 10) === dateStr);

  const getShiftForDay = (dateStr) =>
    shifts.find(s => s.date?.slice(0, 10) === dateStr);

  // ── Vue admin : grille employés × jours ──
  if (employees) {
    return (
      <div className="week-grid">
        {/* En-tête : colonne nom + 7 jours — même grid que les rows */}
        <div className="week-header admin-header">
          <div className="week-emp-col week-emp-header" />
          {days.map((d, i) => {
            const { day, num, isToday } = formatDayHeader(d);
            return (
              <div key={i} className={`week-day-header${isToday ? ' today' : ''}`}>
                <span className="week-day-name">{day}</span>
                <span className="week-day-num">{num}</span>
              </div>
            );
          })}
        </div>

        {/* Lignes employés */}
        {employees.map((emp) => (
          <div key={emp.id} className="week-row">
            <div className="week-emp-col">
              <div className="emp-name">{emp.first_name} {emp.last_name}</div>
              <div className="emp-email">{emp.job_title}</div>
            </div>
            {days.map((d, i) => {
              const dateStr = toISO(d);
              const shift   = getShiftForUserAndDay(emp.id, dateStr);
              const isPast  = d < new Date(new Date().setHours(0, 0, 0, 0));
              return (
                <div
                  key={i}
                  className={`week-cell${shift ? ' has-shift' : ''}${isPast ? ' past' : ''}`}
                  onClick={() => !shift && isAdmin && onCellClick?.({ userId: emp.id, date: dateStr })}
                >
                  {shift ? (
                    <ShiftCard
                      shift={shift}
                      isAdmin={isAdmin}
                      compact={true}
                      onClick={() => isAdmin && onShiftClick?.(shift)}
                      onDelete={onShiftDelete}
                    />
                  ) : (
                    isAdmin && !isPast && <div className="cell-add-hint">+ Ajouter</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── Vue employé : une seule ligne ──
  return (
    <div className="week-grid">
      <div className="week-header employee-header">
        {days.map((d, i) => {
          const { day, num, isToday } = formatDayHeader(d);
          return (
            <div key={i} className={`week-day-header${isToday ? ' today' : ''}`}>
              <span className="week-day-name">{day}</span>
              <span className="week-day-num">{num}</span>
            </div>
          );
        })}
      </div>
      <div className="week-row employee-row">
        {days.map((d, i) => {
          const dateStr = toISO(d);
          const shift   = getShiftForDay(dateStr);
          return (
            <div key={i} className={`week-cell${shift ? ' has-shift' : ''}`}>
              {shift
                ? <ShiftCard shift={shift} isAdmin={false} compact={true} />
                : <div className="cell-empty">—</div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}