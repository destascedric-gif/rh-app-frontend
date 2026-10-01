import { useState } from 'react';
import { toISO } from './WeekView';
import { getEmployeeColor } from './employeeColor';
import { getShiftTimeType } from './shiftTimeType';

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

// Classe de couleur d'une étiquette : ouverture / fermeture / hors travail
const chipKind = (shift, templates) => {
  const type = shift.type || 'travail';
  if (type !== 'travail') return 'off';
  return getShiftTimeType(shift, templates) === 'fermeture' ? 'close' : 'open';
};

export default function PhoneCalendar({
  year, month, shifts, templates = [], isAdmin = false, selectedUserId,
  onShiftClick, onShiftDelete, onAddShift,
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

  const visibleShifts = selectedUserId
    ? shifts.filter((s) => s.user_id === selectedUserId)
    : shifts;
  const shiftsOn = (dateStr) => visibleShifts
    .filter((s) => s.date?.slice(0, 10) === dateStr)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  const weeks = getMonthWeeks(year, month);
  const selectedDate = new Date(`${selected}T12:00:00`);
  const selectedShifts = shiftsOn(selected);

  return (
    <div className="pcal">
      <div className="pcal-head" aria-hidden="true">
        {DAY_HEADERS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="pcal-grid">
        {weeks.flat().map((day) => {
          const dateStr = toISO(day);
          const dayShifts = shiftsOn(dateStr);
          const label = `${DAY_NAMES[day.getDay()]} ${day.getDate()} ${MONTH_NAMES[day.getMonth()]}`
            + (dayShifts.length ? `, ${dayShifts.length} créneau${dayShifts.length > 1 ? 'x' : ''}` : '');
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
              <span className={`pcal-num${dateStr === todayStr ? ' pcal-num--today' : ''}`}>{day.getDate()}</span>
              {dayShifts.slice(0, MAX_CHIPS).map((s) => {
                const kind = chipKind(s, templates);
                // Employé (un seul créneau par jour) : début et fin l'un sous
                // l'autre. Gérant : initiales de chaque employé.
                if (!isAdmin && kind !== 'off') {
                  return (
                    <span key={s.id} className={`pcal-chip pcal-chip--${kind} pcal-chip--times`}>
                      <span>{shortTime(s.start_time)}</span>
                      <span>{shortTime(s.end_time)}</span>
                    </span>
                  );
                }
                const text = isAdmin
                  ? `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase()
                  : TYPE_LABELS[s.type];
                return <span key={s.id} className={`pcal-chip pcal-chip--${kind}`}>{text}</span>;
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

        {selectedShifts.length === 0 ? (
          <p className="pcal-empty">Aucun créneau ce jour-là.</p>
        ) : (
          <ul className="pcal-list">
            {selectedShifts.map((s) => {
              const kind = chipKind(s, templates);
              const isWork = kind !== 'off';
              const content = (
                <>
                  <span className={`pcal-bar pcal-bar--${kind}`} />
                  <span className="pcal-item-main">
                    {isAdmin && (
                      <span className="pcal-item-name">
                        <i className="emp-color-dot" style={{ background: getEmployeeColor(s.user_id) }} />
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
