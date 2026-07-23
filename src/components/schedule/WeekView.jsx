import { useState } from 'react';
import ShiftCard from './ShiftCard';
import { getEmployeeColor } from './employeeColor';

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
  const dow      = date.getDay();
  const idx      = dow === 0 ? 6 : dow - 1;
  const day      = DAY_LABELS[idx];
  const num      = date.getDate();
  const isToday  = toISO(date) === toISO(new Date());
  const isWeekend = dow === 0 || dow === 6;
  return { day, num, isToday, isWeekend };
};

export default function WeekView({ days, shifts, employees, isAdmin, onShiftClick, onShiftDelete, onTemplateDrop }) {
  const [dragOverCell, setDragOverCell] = useState(null);

  const getShiftForUserAndDay = (userId, dateStr) =>
    shifts.find(s => s.user_id === userId && s.date?.slice(0, 10) === dateStr);

  const getShiftForDay = (dateStr) =>
    shifts.find(s => s.date?.slice(0, 10) === dateStr);

  // Total des heures nettes travaillées sur la semaine affichée, pour
  // repérer en un coup d'œil une charge trop haute ou trop basse.
  const getWeeklyTotal = (userId) =>
    days.reduce((sum, d) => {
      const shift = getShiftForUserAndDay(userId, toISO(d));
      const isWorkShift = shift && (!shift.type || shift.type === 'travail');
      return sum + (isWorkShift ? (shift.net_hours ?? 0) : 0);
    }, 0);

  // Un congé/repos/absence qui se poursuit la veille/le lendemain (même
  // employé, même type) est affiché relié plutôt que comme des cases
  // séparées répétées (façon Google Agenda).
  const getRunEdges = (userId, dayIndex) => {
    const shift = getShiftForUserAndDay(userId, toISO(days[dayIndex]));
    const type  = shift?.type || 'travail';
    if (!shift || type === 'travail') return { continuesPrev: false, continuesNext: false };

    const sameType = (other) => other && (other.type || 'travail') === type;
    const prev = dayIndex > 0 ? getShiftForUserAndDay(userId, toISO(days[dayIndex - 1])) : null;
    const next = dayIndex < days.length - 1 ? getShiftForUserAndDay(userId, toISO(days[dayIndex + 1])) : null;
    return { continuesPrev: sameType(prev), continuesNext: sameType(next) };
  };

  // ── Vue admin ──
  if (employees) {
    return (
      <div className="week-grid">
        <table className="week-table">
          <colgroup>
            <col className="col-emp" />
            {days.map((_, i) => <col key={i} className="col-day" />)}
            <col className="col-total" />
          </colgroup>
          <thead>
            <tr>
              <th className="week-th-emp" />
              {days.map((d, i) => {
                const { day, num, isToday, isWeekend } = formatDayHeader(d);
                return (
                  <th key={i} className={`week-th-day${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}`}>
                    <span className="week-day-name">{day}</span>
                    <span className="week-day-num">{num}</span>
                  </th>
                );
              })}
              <th className="week-th-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const empColor = getEmployeeColor(emp.id);
              return (
                <tr key={emp.id}>
                  <td className="week-td-emp">
                    <div className="week-td-emp-inner">
                      <span className="emp-color-dot" style={{ background: empColor }} />
                      <div>
                        <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                        <div className="emp-email">{emp.job_title}</div>
                      </div>
                    </div>
                  </td>
                  {days.map((d, i) => {
                    const dateStr    = toISO(d);
                    const shift      = getShiftForUserAndDay(emp.id, dateStr);
                    const isPast     = d < new Date(new Date().setHours(0, 0, 0, 0));
                    const { isWeekend } = formatDayHeader(d);
                    const { continuesPrev, continuesNext } = getRunEdges(emp.id, i);
                    const cellKey    = `${emp.id}-${dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    return (
                      <td
                        key={i}
                        className={`week-td-cell${shift ? ' has-shift' : ''}${isPast ? ' past' : ''}${isWeekend ? ' weekend' : ''}${isDragOver ? ' drag-over' : ''}`}
                        onDragOver={(e) => { if (onTemplateDrop) e.preventDefault(); }}
                        onDragEnter={(e) => { if (onTemplateDrop) { e.preventDefault(); setDragOverCell(cellKey); } }}
                        onDragLeave={() => setDragOverCell((k) => (k === cellKey ? null : k))}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverCell(null);
                          if (!onTemplateDrop) return;
                          const raw = e.dataTransfer.getData('application/json');
                          if (!raw) return;
                          onTemplateDrop(emp.id, dateStr, JSON.parse(raw));
                        }}
                      >
                        {shift ? (
                          <ShiftCard
                            shift={shift}
                            isAdmin={isAdmin}
                            compact={true}
                            continuesPrev={continuesPrev}
                            continuesNext={continuesNext}
                            onClick={() => isAdmin && onShiftClick?.(shift)}
                            onDelete={onShiftDelete}
                          />
                        ) : (
                          <div className="cell-empty">—</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="week-td-total">{getWeeklyTotal(emp.id).toFixed(1)} h</td>
                </tr>
              );
            })}
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
              const { day, num, isToday, isWeekend } = formatDayHeader(d);
              return (
                <th key={i} className={`week-th-day${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}`}>
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
              const { isWeekend } = formatDayHeader(d);

              const type = shift?.type || 'travail';
              const sameType = (other) => other && (other.type || 'travail') === type;
              const prevShift = i > 0 ? getShiftForDay(toISO(days[i - 1])) : null;
              const nextShift = i < days.length - 1 ? getShiftForDay(toISO(days[i + 1])) : null;
              const continuesPrev = shift && type !== 'travail' && sameType(prevShift);
              const continuesNext = shift && type !== 'travail' && sameType(nextShift);

              return (
                <td key={i} className={`week-td-cell${shift ? ' has-shift' : ''}${isWeekend ? ' weekend' : ''}`}>
                  {shift
                    ? <ShiftCard shift={shift} isAdmin={false} compact={true} continuesPrev={continuesPrev} continuesNext={continuesNext} />
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