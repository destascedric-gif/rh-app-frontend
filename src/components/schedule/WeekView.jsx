import { useState } from 'react';
import ShiftCard from './ShiftCard';
import MeetingTag from './MeetingTag';
import { meetingsOn, meetingExtraMinutes } from './meetingUtils';
import { holidayName } from '../../utils/holidays';
import { isClosedDay } from '../../utils/openDays';
import { frDecimal } from '../../utils/formatNumber';

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
const formatDayHeader = (date, openDays, pentecostWorked) => {
  const dow      = date.getDay();
  const idx      = dow === 0 ? 6 : dow - 1;
  const day      = DAY_LABELS[idx];
  const num      = date.getDate();
  const isToday  = toISO(date) === toISO(new Date());
  // Jour de fermeture de la boutique (par défaut samedi et dimanche)
  const isWeekend = isClosedDay(date, openDays);
  const holiday   = holidayName(toISO(date), pentecostWorked);
  return { day, num, isToday, isWeekend, holiday };
};

// En-tête d'un jour : « Férié » sur la même ligne que le nom du jour, pour
// ne pas agrandir l'en-tête ; le nom de la fête s'affiche au survol. Même
// principe pour « Fermé » (jour de fermeture de la boutique).
const DayHeader = ({ date, openDays, pentecostWorked }) => {
  const { day, num, isToday, isWeekend, holiday } = formatDayHeader(date, openDays, pentecostWorked);
  return (
    <th
      className={`week-th-day${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}${holiday ? ' holiday' : ''}`}
      title={holiday ? `Jour férié : ${holiday}` : undefined}
    >
      <span className="week-day-name">{day}{holiday
        ? <span className="week-day-holiday"> · Férié</span>
        : isWeekend && <span className="week-day-closed"> · Fermé</span>}</span>
      <span className="week-day-num">{num}</span>
    </th>
  );
};

// Poignée de réorganisation des employés (glisser-déposer une ligne) : six
// points façon « grip », reconnaissable comme prise en main sans texte.
const DragHandleIcon = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
    <circle cx="2.5" cy="2.5" r="1.5" />
    <circle cx="7.5" cy="2.5" r="1.5" />
    <circle cx="2.5" cy="8"   r="1.5" />
    <circle cx="7.5" cy="8"   r="1.5" />
    <circle cx="2.5" cy="13.5" r="1.5" />
    <circle cx="7.5" cy="13.5" r="1.5" />
  </svg>
);

// showTotals = false et currentUserId : planning de l'équipe vu par un
// employé (pas de colonne Total, sa propre ligne mise en avant)
// onReorder(draggedEmpId, targetEmpId) : fourni uniquement côté gérant,
// permet de glisser une ligne employé pour la remonter ou la descendre.
export default function WeekView({ days, shifts, meetings = [], countMeetings = false, employees, isAdmin, onShiftClick, onShiftDelete, onTemplateDrop, onMeetingClick, showTotals = true, currentUserId = null, onReorder, openDays, pentecostWorked = false }) {
  const [dragOverCell, setDragOverCell] = useState(null);
  const [draggedEmpId, setDraggedEmpId] = useState(null);
  const [dragOverEmpId, setDragOverEmpId] = useState(null);

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
      // Réunions hors créneau, si l'entreprise les compte comme travail
      const meetingHours = countMeetings ? meetingExtraMinutes(meetings, shift, userId, toISO(d)) / 60 : 0;
      return sum + (isWorkShift ? (shift.net_hours ?? 0) : 0) + meetingHours;
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
            {showTotals && <col className="col-total" />}
          </colgroup>
          <thead>
            <tr>
              <th className="week-th-emp" />
              {days.map((d, i) => <DayHeader key={i} date={d} openDays={openDays} pentecostWorked={pentecostWorked} />)}
              {showTotals && <th className="week-th-total">Total</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const isDraggedRow = draggedEmpId === emp.id;
              const isDropTarget = dragOverEmpId === emp.id && draggedEmpId && draggedEmpId !== emp.id;
              return (
                <tr
                  key={emp.id}
                  className={[
                    emp.id === currentUserId ? 'week-row-me' : '',
                    isDraggedRow ? 'week-row-dragging' : '',
                    isDropTarget ? 'week-row-drag-over' : '',
                  ].filter(Boolean).join(' ') || undefined}
                  onDragOver={(e) => { if (onReorder && draggedEmpId) { e.preventDefault(); setDragOverEmpId(emp.id); } }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (onReorder && draggedEmpId && draggedEmpId !== emp.id) onReorder(draggedEmpId, emp.id);
                    setDraggedEmpId(null);
                    setDragOverEmpId(null);
                  }}
                >
                  <td className="week-td-emp">
                    <div className="week-td-emp-inner">
                      {onReorder && (
                        <span
                          className="week-drag-handle"
                          draggable
                          onDragStart={(e) => { setDraggedEmpId(emp.id); e.dataTransfer.effectAllowed = 'move'; }}
                          onDragEnd={() => { setDraggedEmpId(null); setDragOverEmpId(null); }}
                          role="button"
                          tabIndex={-1}
                          aria-label={`Réorganiser ${emp.first_name} ${emp.last_name}`}
                          title="Glisser pour réorganiser"
                        >
                          <DragHandleIcon />
                        </span>
                      )}
                      <div>
                        <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                        <div className="emp-email">{emp.id === currentUserId ? 'Vous' : emp.job_title}</div>
                      </div>
                    </div>
                  </td>
                  {days.map((d, i) => {
                    const dateStr    = toISO(d);
                    const shift      = getShiftForUserAndDay(emp.id, dateStr);
                    const isPast     = d < new Date(new Date().setHours(0, 0, 0, 0));
                    const { isWeekend, holiday } = formatDayHeader(d, openDays, pentecostWorked);
                    const { continuesPrev, continuesNext } = getRunEdges(emp.id, i);
                    const cellKey    = `${emp.id}-${dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    const cellMeetings = meetingsOn(meetings, dateStr, emp.id);
                    return (
                      <td
                        key={i}
                        className={`week-td-cell${shift ? ' has-shift' : ''}${isPast ? ' past' : ''}${isWeekend ? ' weekend' : ''}${holiday ? ' holiday' : ''}${isDragOver ? ' drag-over' : ''}`}
                        // Repères pour le glisser au doigt (touchTemplateDrag)
                        data-drop-emp={onTemplateDrop ? emp.id : undefined}
                        data-drop-date={onTemplateDrop ? dateStr : undefined}
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
                        ) : cellMeetings.length === 0 && (
                          <div className="cell-empty">{isWeekend ? 'Fermé' : '—'}</div>
                        )}
                        {isAdmin && isWeekend && shift && (shift.type || 'travail') === 'travail' && (
                          <span className="week-closed-warn" title="Créneau placé un jour de fermeture">Jour fermé</span>
                        )}
                        {cellMeetings.map((m) => (
                          <MeetingTag key={m.id} meeting={m} onClick={isAdmin ? onMeetingClick : undefined} />
                        ))}
                      </td>
                    );
                  })}
                  {showTotals && <td className="week-td-total">{frDecimal(getWeeklyTotal(emp.id))} h</td>}
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
            {days.map((d, i) => <DayHeader key={i} date={d} openDays={openDays} pentecostWorked={pentecostWorked} />)}
          </tr>
        </thead>
        <tbody>
          <tr>
            {days.map((d, i) => {
              const dateStr = toISO(d);
              const shift   = getShiftForDay(dateStr);
              const { isWeekend, holiday } = formatDayHeader(d, openDays, pentecostWorked);
              const dayMeetings = meetingsOn(meetings, dateStr);

              const type = shift?.type || 'travail';
              const sameType = (other) => other && (other.type || 'travail') === type;
              const prevShift = i > 0 ? getShiftForDay(toISO(days[i - 1])) : null;
              const nextShift = i < days.length - 1 ? getShiftForDay(toISO(days[i + 1])) : null;
              const continuesPrev = shift && type !== 'travail' && sameType(prevShift);
              const continuesNext = shift && type !== 'travail' && sameType(nextShift);

              return (
                <td key={i} className={`week-td-cell${shift ? ' has-shift' : ''}${isWeekend ? ' weekend' : ''}${holiday ? ' holiday' : ''}`}>
                  {shift
                    ? <ShiftCard shift={shift} isAdmin={false} compact={true} continuesPrev={continuesPrev} continuesNext={continuesNext} />
                    : dayMeetings.length === 0 && <div className="cell-empty">{isWeekend ? 'Fermé' : '—'}</div>
                  }
                  {dayMeetings.map((m) => <MeetingTag key={m.id} meeting={m} />)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}