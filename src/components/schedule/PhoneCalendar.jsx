import { useState } from 'react';
import { toISO } from './WeekView';
import { shiftColorVar } from './shiftColor';
import MeetingTag, { MeetingIcon } from './MeetingTag';
import { meetingsOn } from './meetingUtils';

// Calendrier du mois pour téléphone, façon Google Agenda : la grille tient
// dans la largeur de l'écran, chaque jour porte de petites étiquettes, et
// toucher un jour affiche son détail en dessous.

const DAY_HEADERS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const DAY_NAMES   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const TYPE_LABELS = { conge: 'Congé', repos: 'Repos', absence: 'Absence' };
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

// Étiquette d'un créneau de travail (couleur de son horaire type) ou hors travail
const chipKind = (shift) => ((shift.type || 'travail') === 'travail' ? 'work' : 'off');

export default function PhoneCalendar({
  year, month, shifts, meetings = [], isAdmin = false, selectedUserIds = [],
  onShiftClick, onShiftDelete, onAddShift, onMeetingClick,
}) {
  const todayStr = toISO(new Date());
  const inMonth  = (d) => d.getMonth() === month;

  // Jour sélectionné : aujourd'hui s'il est dans le mois affiché, sinon le 1er
  const [selected, setSelected] = useState(() => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month
      ? todayStr
      : toISO(new Date(year, month, 1));
  });

  const visibleShifts = selectedUserIds.length > 0
    ? shifts.filter((s) => selectedUserIds.includes(s.user_id))
    : shifts;
  // Réunions d'un jour, limitées aux employés affichés
  const meetingsOnDay = (dateStr) => meetingsOn(meetings, dateStr)
    .filter((m) => selectedUserIds.length === 0 || m.participants?.some((p) => selectedUserIds.includes(p.id)));
  // Créneaux travaillés d'abord (par heure de début), puis repos / congés :
  // les cases n'affichent que 3 étiquettes, elles doivent montrer qui travaille.
  const shiftsOn = (dateStr) => visibleShifts
    .filter((s) => s.date?.slice(0, 10) === dateStr)
    .sort((a, b) => {
      const offA = chipKind(a) === 'off' ? 1 : 0;
      const offB = chipKind(b) === 'off' ? 1 : 0;
      return offA - offB || (a.start_time ?? '').localeCompare(b.start_time ?? '');
    });

  const weeks = getMonthWeeks(year, month);
  const selectedDate = new Date(`${selected}T12:00:00`);
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
          const dayShifts = shiftsOn(dateStr);
          const hasMeeting = meetingsOnDay(dateStr).length > 0;
          const label = `${DAY_NAMES[day.getDay()]} ${day.getDate()} ${MONTH_NAMES[day.getMonth()]}`
            + (dayShifts.length ? `, ${dayShifts.length} créneau${dayShifts.length > 1 ? 'x' : ''}` : '')
            + (hasMeeting ? ', réunion' : '');
          return (
            <button
              key={dateStr}
              type="button"
              className={[
                'pcal-day',
                inMonth(day) ? '' : 'pcal-day--other',
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
                if (!isAdmin && kind !== 'off') {
                  return (
                    <span key={s.id} className={`pcal-chip pcal-chip--${kind} pcal-chip--times`} style={shiftColorVar(s)}>
                      <span>{shortTime(s.start_time)}</span>
                      <span>{shortTime(s.end_time)}</span>
                    </span>
                  );
                }
                const text = isAdmin
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
      <section className="pcal-detail" aria-live="polite">
        <div className="pcal-detail-head">
          <h2>{DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}</h2>
          {isAdmin && onAddShift && (
            <button type="button" className="btn-ghost btn-sm" onClick={() => onAddShift(selected)}>+ Ajouter</button>
          )}
        </div>

        {selectedMeetings.length > 0 && (
          <div className="pcal-meetings">
            {selectedMeetings.map((m) => (
              <div key={m.id} className="pcal-meeting-row">
                <MeetingTag meeting={m} onClick={isAdmin ? onMeetingClick : undefined} />
                <span className="pcal-meeting-who">{m.participants?.map((p) => p.first_name).join(', ')}</span>
              </div>
            ))}
          </div>
        )}

        {selectedShifts.length === 0 ? (
          <p className="pcal-empty">Aucun créneau ce jour-là.</p>
        ) : (
          <ul className="pcal-list">
            {selectedShifts.map((s) => {
              const kind = chipKind(s);
              const isWork = kind !== 'off';
              const content = (
                <>
                  <span className={`pcal-bar pcal-bar--${kind}`} style={isWork ? shiftColorVar(s) : undefined} />
                  <span className="pcal-item-main">
                    {isAdmin && (
                      <span className="pcal-item-name">
                        {s.first_name} {s.last_name}
                      </span>
                    )}
                    <span className="pcal-item-time">
                      {isWork
                        ? `${s.start_time?.slice(0, 5)} → ${s.end_time?.slice(0, 5)}`
                        : (s.note || TYPE_LABELS[s.type])}
                    </span>
                  </span>
                  {isWork && s.net_hours ? <span className="pcal-item-hours">{s.net_hours} h</span> : null}
                </>
              );
              return (
                <li key={s.id} className="pcal-row">
                  {isAdmin && onShiftClick
                    ? <button type="button" className="pcal-item" onClick={() => onShiftClick(s)}>{content}</button>
                    : <div className="pcal-item">{content}</div>}
                  {isAdmin && onShiftDelete && (
                    <button
                      type="button"
                      className="pcal-delete"
                      onClick={() => onShiftDelete(s)}
                      aria-label={`Supprimer le créneau de ${s.first_name} ${s.last_name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
