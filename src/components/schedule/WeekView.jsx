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
  const dow     = date.getDay();
  const idx     = dow === 0 ? 6 : dow - 1;
  const day     = DAY_LABELS[idx];
  const num     = date.getDate();
  const isToday = toISO(date) === toISO(new Date());
  return { day, num, isToday };
};

export default function WeekView({ days, shifts, employees, isAdmin, onCellClick, onShiftClick, onShiftDelete }) {
  const getShiftForUserAndDay = (userId, dateStr) =>
    shifts.find(s => s.user_id === userId && s.date?.slice(0, 10) === dateStr);

  const getShiftForDay = (dateStr) =>
    shifts.find(s => s.date?.slice(0, 10) === dateStr);

  // ── Vue admin ──
  if (employees) {
    return (
      <div className="week-grid">
        <table className="week-table">
          <colgroup>
            <col className="col-emp" />
            {days.map((_, i) => <col key={i} className="col-day" />)}
          </colgroup>
          <thead>
            <tr>
              <th className="week-th-emp" />
              {days.map((d, i) => {
                const { day, num, isToday } = formatDayHeader(d);
                return (
                  <th key={i} className={`week-th-day${isToday ? ' today' : ''}`}>
                    <span className="week-day-name">{day}</span>
                    <span className="week-day-num">{num}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="week-td-emp">
                  <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                  <div className="emp-email">{emp.job_title}</div>
                </td>
                {days.map((d, i) => {
                  const dateStr = toISO(d);
                  const shift   = getShiftForUserAndDay(emp.id, dateStr);
                  const isPast  = d < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <td
                      key={i}
                      className={`week-td-cell${shift ? ' has-shift' : ''}${isPast ? ' past' : ''}`}
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Vue employé ──
  return (
    <div className="week-grid">
      <table className="week-table">
        <colgroup>
          {days.map((_, i) => <col key={i} className="col-day" />)}
        </colgroup>
        <thead>
          <tr>
            {days.map((d, i) => {
              const { day, num, isToday } = formatDayHeader(d);
              return (
                <th key={i} className={`week-th-day${isToday ? ' today' : ''}`}>
                  <span className="week-day-name">{day}</span>
                  <span className="week-day-num">{num}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {days.map((d, i) => {
              const dateStr = toISO(d);
              const shift   = getShiftForDay(dateStr);
              return (
                <td key={i} className={`week-td-cell${shift ? ' has-shift' : ''}`}>
                  {shift
                    ? <ShiftCard shift={shift} isAdmin={false} compact={true} />
                    : <div className="cell-empty">—</div>
                  }
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}