import ShiftCard from './ShiftCard';
import { toISO } from './WeekView';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Génère toutes les cellules du calendrier mensuel (lundi au dimanche)
const getMonthCells = (year, month) => {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0=lundi

  const cells = [];

  // Jours du mois précédent (padding)
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() - (i + 1));
    cells.push({ date: d, currentMonth: false });
  }

  // Jours du mois
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }

  // Compléter jusqu'à 42 cellules (6 semaines)
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }

  return cells;
};

export default function MonthView({ year, month, shifts, employees, isAdmin, selectedUserId, onCellClick, onShiftClick, onShiftDelete }) {
  const cells  = getMonthCells(year, month);
  const today  = toISO(new Date());

  // Filtre les shifts selon l'employé sélectionné (vue admin avec filtre)
  const filteredShifts = selectedUserId
    ? shifts.filter(s => s.user_id === selectedUserId)
    : shifts;

  const getShiftsForDay = (dateStr) =>
    filteredShifts.filter(s => s.date?.slice(0, 10) === dateStr);

  return (
    <div className="month-grid">
      {/* En-tête jours */}
      <div className="month-header">
        {DAY_LABELS.map(d => (
          <div key={d} className="month-day-label">{d}</div>
        ))}
      </div>

      {/* Grille de cellules */}
      <div className="month-cells">
        {cells.map((cell, i) => {
          const dateStr   = toISO(cell.date);
          const dayShifts = getShiftsForDay(dateStr);
          const isToday   = dateStr === today;
          const isPast    = cell.date < new Date(new Date().setHours(0,0,0,0));

          return (
            <div
              key={i}
              className={[
                'month-cell',
                !cell.currentMonth ? 'other-month' : '',
                isToday ? 'today' : '',
                isPast  ? 'past'  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => isAdmin && !dayShifts.length && onCellClick?.({ date: dateStr })}
            >
              <div className="month-cell-num">{cell.date.getDate()}</div>

              {dayShifts.slice(0, 2).map((shift, j) => (
                <ShiftCard
                  key={j}
                  shift={shift}
                  isAdmin={isAdmin}
                  onClick={() => isAdmin && onShiftClick?.(shift)}
                  onDelete={onShiftDelete}
                />
              ))}

              {dayShifts.length > 2 && (
                <div className="month-overflow">+{dayShifts.length - 2} autres</div>
              )}

              {isAdmin && dayShifts.length === 0 && cell.currentMonth && !isPast && (
                <div className="cell-add-hint">+ Ajouter</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
