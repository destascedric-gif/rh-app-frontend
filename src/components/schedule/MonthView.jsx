import { toISO } from './WeekView';
import { getEmployeeColor } from './employeeColor';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const TYPE_LABELS = { travail: 'Travail', conge: 'Congé', repos: 'Repos', absence: 'Absence' };
const typeClass = (type) => type && type !== 'travail' ? ` shift-type--${type}` : '';

const getMonthCells = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const cells    = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - (i + 1));
    cells.push({ date: d, currentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }
  return cells;
};

// Découpe les 42 cellules en 6 semaines de 7
const chunkWeeks = (cells) => {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

export default function MonthView({ year, month, shifts, isAdmin, selectedUserId, onShiftClick, onShiftDelete }) {
  const cells  = getMonthCells(year, month);
  const weeks  = chunkWeeks(cells);
  const today  = toISO(new Date());

  const filteredShifts = selectedUserId
    ? shifts.filter(s => s.user_id === selectedUserId)
    : shifts;

  const getShiftsForDay = (dateStr) =>
    filteredShifts.filter(s => s.date?.slice(0, 10) === dateStr);

  return (
    <div className="month-grid">
      <table className="month-table">
        <colgroup>
          {DAY_LABELS.map((_, i) => <col key={i} />)}
        </colgroup>

        {/* En-tête jours */}
        <thead>
          <tr>
            {DAY_LABELS.map((d, i) => (
              <th key={d} className={`month-th${i >= 5 ? ' weekend' : ''}`}>{d}</th>
            ))}
          </tr>
        </thead>

        {/* Semaines */}
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, di) => {
                const dateStr   = toISO(cell.date);
                const dayShifts = getShiftsForDay(dateStr);
                const isToday   = dateStr === today;
                const isPast    = cell.date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <td
                    key={di}
                    className={[
                      'month-td',
                      !cell.currentMonth ? 'other-month' : '',
                      isToday ? 'today' : '',
                      isPast  ? 'past'  : '',
                      di >= 5 ? 'weekend' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className="month-cell-num">{cell.date.getDate()}</div>

                    {dayShifts.slice(0, 3).map((shift, j) => {
                      const type = shift.type || 'travail';
                      const fullName = shift.last_name
                        ? `${shift.first_name} ${shift.last_name}`
                        : null;
                      const initials = fullName
                        ? `${shift.first_name?.[0] ?? ''}${shift.last_name?.[0] ?? ''}`.toUpperCase()
                        : null;
                      const hours = type === 'travail'
                        ? `${shift.start_time?.slice(0, 5)} → ${shift.end_time?.slice(0, 5)}`
                        : TYPE_LABELS[type];

                      return (
                        <div
                          key={j}
                          className={`month-shift-badge${typeClass(type)}`}
                          onClick={(e) => { e.stopPropagation(); isAdmin && onShiftClick?.(shift); }}
                          data-tooltip={fullName ? `${fullName} · ${hours}` : hours}
                        >
                          {initials && (
                            <span className="badge-avatar" style={{ background: getEmployeeColor(shift.user_id) }}>
                              {initials}
                            </span>
                          )}
                          <span className="badge-hours">{hours}</span>
                          {isAdmin && (
                            <button
                              className="shift-delete-btn-inline"
                              onClick={(e) => { e.stopPropagation(); onShiftDelete?.(shift); }}
                              data-tooltip="Supprimer"
                            >×</button>
                          )}
                        </div>
                      );
                    })}

                    {dayShifts.length > 3 && (
                      <div className="month-overflow">+{dayShifts.length - 3} autres</div>
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