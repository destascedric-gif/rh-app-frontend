import { toISO } from './WeekView';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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

export default function MonthView({ year, month, shifts, isAdmin, selectedUserId, onCellClick, onShiftClick, onShiftDelete }) {
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
            {DAY_LABELS.map(d => (
              <th key={d} className="month-th">{d}</th>
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
                    ].filter(Boolean).join(' ')}
                    onClick={() => isAdmin && dayShifts.length === 0 && onCellClick?.({ date: dateStr })}
                  >
                    <div className="month-cell-num">{cell.date.getDate()}</div>

                    {dayShifts.slice(0, 3).map((shift, j) => {
                      const name  = shift.last_name
                        ? `${shift.first_name?.[0]}. ${shift.last_name}`
                        : null;
                      const hours = `${shift.start_time?.slice(0, 5)} → ${shift.end_time?.slice(0, 5)}`;

                      return (
                        <div
                          key={j}
                          className="month-shift-badge"
                          onClick={(e) => { e.stopPropagation(); isAdmin && onShiftClick?.(shift); }}
                          title={name ? `${name} · ${hours}` : hours}
                        >
                          {name && <span className="badge-name">{name}</span>}
                          <span className="badge-hours">{hours}</span>
                          {isAdmin && (
                            <button
                              className="shift-delete-btn-inline"
                              onClick={(e) => { e.stopPropagation(); onShiftDelete?.(shift); }}
                              title="Supprimer"
                            >×</button>
                          )}
                        </div>
                      );
                    })}

                    {dayShifts.length > 3 && (
                      <div className="month-overflow">+{dayShifts.length - 3} autres</div>
                    )}

                    {isAdmin && dayShifts.length === 0 && cell.currentMonth && !isPast && (
                      <div className="cell-add-hint">+ Ajouter</div>
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