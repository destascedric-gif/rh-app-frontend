import { shiftColorVar } from './shiftColor';
import MeetingTag from './MeetingTag';
import { chipKind, DETAIL_TYPE_LABELS, DETAIL_DAY_NAMES, DETAIL_MONTH_NAMES } from './dayDetailUtils';
import { holidayName } from '../../utils/holidays';

// Détail du jour choisi dans le calendrier du mois (téléphone et ordinateur) :
// - planning du gérant : tous les créneaux, modifiables, + Ajouter ;
// - planning de l'équipe vu par un employé : qui travaille, « Vous » en premier ;
// - son propre planning : horaires, pause et heures nettes.
export default function DayDetail({
  dateStr, shifts, meetings = [], showNames = false, isMe = () => false,
  isAdmin = false, onShiftClick, onShiftDelete, onAddShift, onMeetingClick, className = '',
}) {
  const date = new Date(`${dateStr}T12:00:00`);
  const holiday = holidayName(dateStr);

  return (
    <section className={`pcal-detail ${className}`} aria-live="polite">
      <div className="pcal-detail-head">
        <h2>
          {DETAIL_DAY_NAMES[date.getDay()]} {date.getDate()} {DETAIL_MONTH_NAMES[date.getMonth()]}
          {holiday && <span className="pcal-detail-holiday"> · Férié ({holiday})</span>}
        </h2>
        {isAdmin && onAddShift && (
          <button type="button" className="btn-ghost btn-sm" onClick={() => onAddShift(dateStr)}>+ Ajouter</button>
        )}
      </div>

      {meetings.length > 0 && (
        <div className="pcal-meetings">
          {meetings.map((m) => (
            <div key={m.id} className="pcal-meeting-row">
              <MeetingTag meeting={m} onClick={isAdmin ? onMeetingClick : undefined} />
              <span className="pcal-meeting-who">{m.participants?.map((p) => p.first_name).join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {shifts.length === 0 ? (
        <p className="pcal-empty">Aucun créneau ce jour-là.</p>
      ) : (
        <ul className="pcal-list">
          {shifts.map((s) => {
            const kind = chipKind(s);
            const isWork = kind !== 'off';
            // Son propre planning : la pause sous les horaires
            const breakLine = !showNames && isWork && s.breaks?.length > 0
              ? s.breaks.map((b) => `Pause ${b.start_time.slice(0, 5)} – ${b.end_time.slice(0, 5)}`).join(' · ')
              : null;
            const content = (
              <>
                <span className={`pcal-bar pcal-bar--${kind}`} style={isWork ? shiftColorVar(s) : undefined} />
                <span className="pcal-item-main">
                  {showNames && (
                    <span className="pcal-item-name">
                      {isMe(s) ? 'Vous' : `${s.first_name} ${s.last_name}`}
                    </span>
                  )}
                  <span className="pcal-item-time">
                    {isWork
                      ? `${s.start_time?.slice(0, 5)} → ${s.end_time?.slice(0, 5)}`
                      : (s.note || DETAIL_TYPE_LABELS[s.type])}
                  </span>
                  {breakLine && <span className="pcal-item-break">{breakLine}</span>}
                </span>
                {isWork && s.net_hours ? <span className="pcal-item-hours">{s.net_hours} h</span> : null}
              </>
            );
            return (
              <li key={s.id} className={`pcal-row${isMe(s) ? ' pcal-row--me' : ''}`}>
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
  );
}
