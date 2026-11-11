import { useState, useRef, useLayoutEffect } from 'react';
import { toISO } from './WeekView';
import DayDetail from './DayDetail';
import { sortDayShifts, defaultSelectedDay, DETAIL_DAY_NAMES, DETAIL_MONTH_NAMES } from './dayDetailUtils';
import { shiftColorVar } from './shiftColor';
import MeetingTag, { MeetingIcon } from './MeetingTag';
import { meetingsOn } from './meetingUtils';
import { holidayName } from '../../utils/holidays';
import { isClosedDay, DEFAULT_OPEN_DAYS } from '../../utils/openDays';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const TYPE_LABELS = { travail: 'Travail', conge: 'Congé', repos: 'Repos', absence: 'Absence', absent: 'Absent' };

// "09:30:00" → "9h30", "19:00" → "19h" (créneau du mois sur une seule ligne)
const shortTime = (t) => {
  const [h, m] = (t ?? '').slice(0, 5).split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

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
  // Complète seulement la dernière semaine (pas de rangée entière du mois
  // suivant, vide) : une rangée de moins à faire tenir dans l'écran
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }
  return cells;
};

const dayLabel = (d) => `${DETAIL_DAY_NAMES[d.getDay()].toLowerCase()} ${d.getDate()} ${DETAIL_MONTH_NAMES[d.getMonth()]}`;

// ── Mois qui tient dans l'écran (11 nov. 2026) ──
// Demande de Cédric : sur son ordinateur, le mois débordait toujours en bas
// (un premier essai de cases plus petites débordait encore et a été
// annulé). Désormais, comme Google Agenda, la hauteur des rangées est
// calculée pour que le mois remplisse exactement l'écran, et chaque case
// montre ses créneaux en entier (initiales + horaires) s'il y a la place,
// sinon en petites pastilles d'initiales colorées, comme le mois du
// téléphone (le détail complet du jour s'affiche dessous, au clic).
// Tailles de texte inchangées. Hauteurs en pixels (voir global.css) :
const CELL_PAD   = 8;  // marge intérieure de la case (haut + bas)
const NUM_H      = 24; // numéro du jour
const BADGE_H    = 21; // une pastille de créneau complète
const MEETING_H  = 36; // une étiquette de réunion (deux lignes)
const MINI_W     = 30; // une pastille d'initiales (largeur)
const MINI_GAP   = 3;
const MINI_LINE  = 22; // une ligne de pastilles d'initiales
const MIN_ROW_H  = 70; // en dessous, le mois déborde (très petits écrans)
const BOTTOM_GAP = 14; // espace laissé sous le mois
const PHONE_QUERY_STR = '(max-width: 640px)';

// Disposition d'une case : créneaux complets ou pastilles d'initiales,
// combien en montrer, et s'il faut un « +N ».
const cellLayout = (rowH, cellW, nShifts, nMeetings) => {
  if (!rowH) return { mini: false, shown: Math.min(nShifts, 3) };
  const room = rowH - CELL_PAD - NUM_H;
  if (nShifts * BADGE_H + nMeetings * MEETING_H <= room) return { mini: false, shown: nShifts };
  const perLine  = Math.max(1, Math.floor(((cellW || 120) - 8 + MINI_GAP) / (MINI_W + MINI_GAP)));
  const lines    = Math.max(1, Math.floor((room + MINI_GAP) / MINI_LINE));
  const capacity = perLine * lines;
  if (nShifts + nMeetings <= capacity) return { mini: true, shown: nShifts };
  return { mini: true, shown: Math.max(0, Math.min(nShifts, capacity - 1 - nMeetings)) };
};

// Découpe les cellules en semaines de 7
const chunkWeeks = (cells) => {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

export default function MonthView({
  year, month, shifts, meetings = [], isAdmin, selectedUserIds = [],
  onShiftClick, onShiftDelete, onMeetingClick, onAddShift,
  team = false, currentUserId = null, openDays, pentecostWorked = false,
  onTemplateDropDay,
}) {
  // Jour survolé pendant qu'on glisse un horaire type (gérant)
  const [dragOverDate, setDragOverDate] = useState(null);
  const cells  = getMonthCells(year, month);
  const weeks  = chunkWeeks(cells);
  const today  = toISO(new Date());
  // Jour choisi : son détail s'affiche sous le calendrier (comme sur téléphone)
  const [selected, setSelected] = useState(() => defaultSelectedDay(year, month, toISO));
  // Planning de l'équipe vu par un employé : sa propre ligne en premier (« Vous »)
  const isMe = (s) => team && s.user_id === currentUserId;

  const filteredShifts = selectedUserIds.length > 0
    ? shifts.filter(s => selectedUserIds.includes(s.user_id))
    : shifts;
  // Réunions d'un jour, limitées aux employés affichés
  const getMeetingsForDay = (dateStr) => meetingsOn(meetings, dateStr)
    .filter((m) => selectedUserIds.length === 0 || m.participants?.some((p) => selectedUserIds.includes(p.id)));

  const getShiftsForDay = (dateStr) =>
    filteredShifts.filter(s => s.date?.slice(0, 10) === dateStr);

  // Hauteur des rangées pour que le mois tienne dans l'écran (ordinateur)
  const gridRef = useRef(null);
  const [rowH, setRowH] = useState(null);
  const [cellW, setCellW] = useState(null);
  const nWeeks = weeks.length;
  useLayoutEffect(() => {
    const compute = () => {
      const g = gridRef.current;
      if (!g || window.matchMedia(PHONE_QUERY_STR).matches) { setRowH(null); return; }
      setCellW(g.querySelector('tbody td')?.clientWidth ?? null);
      const top = g.getBoundingClientRect().top + window.scrollY;
      const headH = g.querySelector('thead')?.offsetHeight ?? 30;
      // Espaces de 4 px entre les tuiles + bordure du cadre
      const avail = window.innerHeight - top - BOTTOM_GAP - headH - 4 * (nWeeks + 2) - 2;
      setRowH(Math.max(MIN_ROW_H, Math.floor(avail / nWeeks)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [nWeeks]);

  return (
    <>
    <div className="month-grid" ref={gridRef}>
      <table className="month-table">
        <colgroup>
          {DAY_LABELS.map((_, i) => <col key={i} />)}
        </colgroup>

        {/* En-tête jours */}
        <thead>
          <tr>
            {DAY_LABELS.map((d, i) => (
              <th key={d} className={`month-th${(openDays || DEFAULT_OPEN_DAYS)[i] === '0' ? ' weekend' : ''}`}>{d}</th>
            ))}
          </tr>
        </thead>

        {/* Semaines */}
        <tbody>
          {weeks.map((week, wi) => {
            // Pré-calculé une fois par semaine pour vérifier, pour chaque
            // créneau, si le même employé a le même type de créneau la
            // veille/le lendemain dans la ligne — sert à relier visuellement
            // un congé/repos/absence de plusieurs jours (façon Google
            // Agenda) plutôt que de répéter des cases séparées.
            const rowDayShifts = week.map((cell) => getShiftsForDay(toISO(cell.date)));

            return (
              <tr key={wi}>
                {week.map((cell, di) => {
                  const dateStr   = toISO(cell.date);
                  const dayShifts = rowDayShifts[di];
                  const isToday   = dateStr === today;
                  const isPast    = cell.date < new Date(new Date().setHours(0, 0, 0, 0));

                  const isSelected = dateStr === selected;
                  const dayMeetings = getMeetingsForDay(dateStr);
                  const { mini, shown } = cellLayout(rowH, cellW, dayShifts.length, dayMeetings.length);
                  const hidden = dayShifts.length - shown;
                  const holiday    = holidayName(dateStr, pentecostWorked);

                  return (
                    <td
                      key={di}
                      className={[
                        'month-td',
                        'month-td--selectable',
                        !cell.currentMonth ? 'other-month' : '',
                        isToday ? 'today' : '',
                        isPast  ? 'past'  : '',
                        isClosedDay(cell.date, openDays) ? 'weekend' : '',
                        holiday ? 'holiday' : '',
                        isSelected ? 'selected' : '',
                        dragOverDate === dateStr ? 'drag-over' : '',
                      ].filter(Boolean).join(' ')}
                      // Horaire type lâché sur le jour (souris) ; repère
                      // data-drop-date pour le glisser au doigt. Seulement
                      // les jours du mois (les autres ne sont pas chargés).
                      {...(onTemplateDropDay && cell.currentMonth ? {
                        'data-drop-date': dateStr,
                        onDragOver: (e) => e.preventDefault(),
                        onDragEnter: (e) => { e.preventDefault(); setDragOverDate(dateStr); },
                        onDragLeave: (e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDate((d) => (d === dateStr ? null : d));
                        },
                        onDrop: (e) => {
                          e.preventDefault();
                          setDragOverDate(null);
                          const raw = e.dataTransfer.getData('application/json');
                          if (raw) onTemplateDropDay(dateStr, JSON.parse(raw));
                        },
                      } : {})}
                      onClick={() => setSelected(dateStr)}
                      style={rowH ? { height: rowH } : undefined}
                      title={holiday ? `Jour férié : ${holiday}` : undefined}
                    >
                      <button
                        type="button"
                        className="month-cell-num"
                        onClick={(e) => { e.stopPropagation(); setSelected(dateStr); }}
                        aria-pressed={isSelected}
                        aria-label={`Voir le détail du ${dayLabel(cell.date)}${holiday ? `, férié (${holiday})` : ''}`}
                      >
                        {cell.date.getDate()}
                      </button>
                      {holiday && <span className="month-holiday">Férié</span>}

                      {mini && (
                        // Place insuffisante : pastilles d'initiales colorées
                        <div className="month-minis">
                          {dayShifts.slice(0, shown).map((shift, j) => {
                            const type = shift.type || 'travail';
                            const work = type === 'travail';
                            const name = shift.last_name ? `${shift.first_name} ${shift.last_name}` : null;
                            const label = name
                              ? `${shift.first_name?.[0] ?? ''}${shift.last_name?.[0] ?? ''}`.toUpperCase()
                              : (work ? shortTime(shift.start_time) : TYPE_LABELS[type]?.[0]);
                            const hours = work ? `${shortTime(shift.start_time)} – ${shortTime(shift.end_time)}` : TYPE_LABELS[type];
                            return (
                              <span
                                key={j}
                                className={`month-mini month-mini--${work ? 'work' : 'off'}`}
                                style={work ? shiftColorVar(shift) : undefined}
                                data-tooltip={name ? `${name} · ${hours}` : hours}
                                onClick={(e) => { if (isAdmin && onShiftClick) { e.stopPropagation(); onShiftClick(shift); } }}
                              >{label}</span>
                            );
                          })}
                          {hidden > 0 && <span className="month-mini month-mini--more" data-tooltip="Voir le détail du jour">+{hidden}</span>}
                          {dayMeetings.map((m) => (
                            <span
                              key={m.id}
                              className="month-mini month-mini--meeting"
                              data-tooltip={m.title}
                              onClick={(e) => { if (isAdmin && onMeetingClick) { e.stopPropagation(); onMeetingClick(m); } }}
                            ><MeetingIcon size={12} /></span>
                          ))}
                        </div>
                      )}

                      {!mini && dayShifts.slice(0, shown).map((shift, j) => {
                        const type = shift.type || 'travail';
                        const fullName = shift.last_name
                          ? `${shift.first_name} ${shift.last_name}`
                          : null;
                        const initials = fullName
                          ? `${shift.first_name?.[0] ?? ''}${shift.last_name?.[0] ?? ''}`.toUpperCase()
                          : null;
                        const hours = type === 'travail'
                          ? `${shortTime(shift.start_time)} – ${shortTime(shift.end_time)}`
                          : TYPE_LABELS[type];

                        const sameRun = (other) =>
                          other && other.user_id === shift.user_id && (other.type || 'travail') === type;
                        const isRest = type === 'repos';
                        const continuesPrev = type !== 'travail' && !isRest && di > 0
                          && rowDayShifts[di - 1].some(sameRun);
                        const continuesNext = type !== 'travail' && !isRest && di < 6
                          && rowDayShifts[di + 1].some(sameRun);
                        const showLabel = !continuesPrev;

                        const isWorkShift = type === 'travail';
                        // Un créneau de travail prend la couleur de son horaire type ;
                        // un congé/absence est gris rayé (.shift-non-work).
                        const style = isWorkShift ? shiftColorVar(shift) : undefined;
                        const runClass = `${continuesPrev ? ' continues-prev' : ''}${continuesNext ? ' continues-next' : ''}`;
                        const timeTypeClass = isWorkShift ? ' shift-colored' : '';

                        return (
                          <div
                            key={j}
                            className={`month-shift-badge${isRest ? ' shift-rest' : (!isWorkShift ? ' shift-non-work' : '')}${timeTypeClass}${runClass}`}
                            style={style}
                            onClick={(e) => {
                              // Gérant : le créneau s'ouvre ; sinon le clic choisit le jour
                              if (isAdmin && onShiftClick) { e.stopPropagation(); onShiftClick(shift); }
                            }}
                            data-tooltip={fullName ? `${fullName} · ${hours}` : hours}
                          >
                            {initials && showLabel && (
                              <span className="badge-avatar">
                                {initials}
                              </span>
                            )}
                            {showLabel && <span className="badge-hours">{hours}</span>}
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

                      {!mini && hidden > 0 && (
                        <div className="month-overflow">+{hidden} autre{hidden > 1 ? 's' : ''}</div>
                      )}
                      {!mini && dayMeetings.map((m) => (
                        <MeetingTag key={m.id} meeting={m} onClick={isAdmin ? onMeetingClick : undefined} />
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

      {/* Détail du jour choisi */}
      <DayDetail
        openDays={openDays}
        className="day-detail--desktop"
        dateStr={selected}
        shifts={sortDayShifts(getShiftsForDay(selected), isMe)}
        meetings={getMeetingsForDay(selected)}
        showNames={isAdmin || team}
        isMe={isMe}
        isAdmin={isAdmin}
        onShiftClick={onShiftClick}
        onShiftDelete={onShiftDelete}
        onAddShift={onAddShift}
        onMeetingClick={onMeetingClick}
        pentecostWorked={pentecostWorked}
      />
    </>
  );
}