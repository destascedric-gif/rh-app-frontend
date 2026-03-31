import ShiftCard from './ShiftCard';

// Génère les 7 jours de la semaine à partir du lundi
export const getWeekDays = (monday) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
};

export const toISO = (date) => date.toISOString().slice(0, 10);

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formatDayHeader = (date) => {
  const day   = DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const num   = date.getDate();
  const today = new Date();
  const isToday = toISO(date) === toISO(today);
  return { day, num, isToday };
};

export default function WeekView({ days, shifts, employees, isAdmin, onCellClick, onShiftClick, onShiftDelete }) {
  // En vue admin multi-employés : une ligne par employé
  // En vue employé : une ligne unique

  const getShiftForUserAndDay = (userId, dateStr) =>
    shifts.find(s => s.user_id === userId && s.date?.slice(0, 10) === dateStr);

  const getShiftForDay = (dateStr) =>
    shifts.find(s => s.date?.slice(0, 10) === dateStr);

  if (employees) {
    // Vue admin : grille employés × jours
    return (
      <div className="week-grid admin">
        {/* En-tête jours */}
        <div className="week-header">
          <div className="week-emp-col" />
          {days.map((d, i) => {
            const { day, num, isToday } = formatDayHeader(d);
            return (
              <div key={i} className={`week-day-header ${isToday ? 'today' : ''}`}>
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
              const isPast  = d < new Date(new Date().setHours(0,0,0,0));
              return (
                <div
                  key={i}
                  className={`week-cell ${shift ? 'has-shift' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => !shift && isAdmin && onCellClick?.({ userId: emp.id, date: dateStr })}
                >
                  {shift ? (
                    <ShiftCard
                      shift={shift}
                      isAdmin={isAdmin}
                      onClick={() => isAdmin && onShiftClick?.(shift)}
                      onDelete={onShiftDelete}
                    />
                  ) : (
                    isAdmin && <div className="cell-add-hint">+ Ajouter</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Vue employé : une seule ligne
  return (
    <div className="week-grid employee">
      <div className="week-header">
        {days.map((d, i) => {
          const { day, num, isToday } = formatDayHeader(d);
          return (
            <div key={i} className={`week-day-header ${isToday ? 'today' : ''}`}>
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
            <div key={i} className={`week-cell ${shift ? 'has-shift' : ''}`}>
              {shift
                ? <ShiftCard shift={shift} isAdmin={false} />
                : <div className="cell-empty">—</div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
