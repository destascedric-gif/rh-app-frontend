import { useState } from 'react';
import { toISO } from './WeekView';
import { shiftColorVar } from './shiftColor';
import { MeetingIcon } from './MeetingTag';
import { meetingsOn } from './meetingUtils';
import DayDetail from './DayDetail';
import { chipKind, sortDayShifts, defaultSelectedDay } from './dayDetailUtils';
import { holidayName } from '../../utils/holidays';

// Calendrier du mois pour téléphone, façon Google Agenda : la grille tient
// dans la largeur de l'écran, chaque jour porte de petites étiquettes, et
// toucher un jour affiche son détail en dessous.

const DAY_HEADERS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const DAY_NAMES   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const TYPE_LABELS = { conge: 'Congé', repos: 'Repos', absence: 'Absence', absent: 'Absent' };
const MAX_CHIPS = 3;

// "08:30:00" → "8h30", "09:00" → "9h00" (minutes toujours écrites, pour ne
// pas confondre "9h" avec une durée de 9 heures)
const shortTime = (t) => {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':');
  return `${Number(h)}h${m}`;
};

// Semaines (lundi → dimanche) couvrant tout le mois, sans semaine vide en trop
const getMonthWeeks = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0);

  const weeks = [];
  const cursor = new Date(start);
  while (cursor <= last) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

export default function PhoneCalendar({
  year, month, shifts, meetings = [], isAdmin = false, selectedUserIds = [],
  onShiftClick, onShiftDelete, onAddShift, onMeetingClick,
  team = false, currentUserId = null,
}) {
  // team : planning de l'équipe vu par un employé, en lecture seule —
  // initiales comme pour le gérant, sa propre ligne en premier (« Vous »),
  // seules les personnes qui travaillent occupent les cases.
  const showNames = isAdmin || team;
  const isMe = (s) => team && s.user_id === currentUserId;
  const todayStr = toISO(new Date());
  const inMonth  = (d) => d.getMonth() === month;

  // Jour sélectionné : aujourd'hui s'il est dans le mois affiché, sinon le 1er
  const [selected, setSelected] = useState(() => defaultSelectedDay(year, month, toISO));

  const visibleShifts = selectedUserIds.length > 0
    ? shifts.filter((s) => selectedUserIds.includes(s.user_id))
    : shifts;
  // Réunions d'un jour, limitées aux employés affichés
  const meetingsOnDay = (dateStr) => meetingsOn(meetings, dateStr)
    .filter((m) => selectedUserIds.length === 0 || m.participants?.some((p) => selectedUserIds.includes(p.id)));
  // Créneaux travaillés d'abord (par heure de début), puis repos / congés :
  // les cases n'affichent que 3 étiquettes, elles doivent montrer qui travaille.
  const shiftsOn = (dateStr) => sortDayShifts(
    visibleShifts.filter((s) => s.date?.slice(0, 10) === dateStr),
    isMe
  );

  const weeks = getMonthWeeks(year, month);
  const selectedShifts = shiftsOn(selected);
  const selectedMeetings = meetingsOnDay(selected);

  return (
    <div className="pcal">
      <div className="pcal-head" aria-hidden="true">
        {DAY_HEADERS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="pcal-grid">
        {weeks.flat().map((day) => {
          const dateStr = toISO(day);
          const dayShifts = shiftsOn(dateStr).filter((s) => !team || chipKind(s) === 'work');
          const hasMeeting = meetingsOnDay(dateStr).length > 0;
          const holiday = holidayName(dateStr);
          const label = `${DAY_NAMES[day.getDay()]} ${day.getDate()} ${MONTH_NAMES[day.getMonth()]}`
            + (holiday ? `, férié (${holiday})` : '')
            + (dayShifts.length ? `, ${dayShifts.length} créneau${dayShifts.length > 1 ? 'x' : ''}` : '')
            + (hasMeeting ? ', réunion' : '');
          return (
            <button
              key={dateStr}
              type="button"
              className={[
                'pcal-day',
                inMonth(day) ? '' : 'pcal-day--other',
                holiday ? 'pcal-day--holiday' : '',
                dateStr === selected ? 'pcal-day--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelected(dateStr)}
              aria-label={label}
              aria-pressed={dateStr === selected}
            >
              <span className="pcal-num-row">
                <span className={`pcal-num${dateStr === todayStr ? ' pcal-num--today' : ''}`}>{day.getDate()}</span>
                {hasMeeting && <span className="pcal-meeting"><MeetingIcon size={11} /></span>}
              </span>
              {dayShifts.slice(0, MAX_CHIPS).map((s) => {
                const kind = chipKind(s);
                // Employé (un seul créneau par jour) : début et fin l'un sous
                // l'autre. Gérant : initiales de chaque employé.
                if (!showNames && kind !== 'off') {
                  return (
                    <span key={s.id} className={`pcal-chip pcal-chip--${kind} pcal-chip--times`} style={shiftColorVar(s)}>
                      <span>{shortTime(s.start_time)}</span>
                      <span>{shortTime(s.end_time)}</span>
                    </span>
                  );
                }
                const text = showNames
                  ? `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase()
                  : TYPE_LABELS[s.type];
                return <span key={s.id} className={`pcal-chip pcal-chip--${kind}`} style={kind === 'work' ? shiftColorVar(s) : undefined}>{text}</span>;
              })}
              {dayShifts.length > MAX_CHIPS && (
                <span className="pcal-more">+{dayShifts.length - MAX_CHIPS}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Détail du jour touché */}
      <DayDetail
        dateStr={selected}
        shifts={selectedShifts}
        meetings={selectedMeetings}
        showNames={showNames}
        isMe={isMe}
        isAdmin={isAdmin}
        onShiftClick={onShiftClick}
        onShiftDelete={onShiftDelete}
        onAddShift={onAddShift}
        onMeetingClick={onMeetingClick}
      />
    </div>
  );
}
