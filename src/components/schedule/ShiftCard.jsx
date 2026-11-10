import { shiftColorVar } from './shiftColor';

const formatTime = (t) => t?.slice(0, 5) ?? '';

const TYPE_LABELS = { travail: 'Travail', conge: 'Congé', repos: 'Repos', absence: 'Absence', absent: 'Absent' };
// Libellés courts pour les cases étroites de la semaine sur téléphone
const SHORT_LABELS = { ...TYPE_LABELS, absence: 'Abs.', absent: 'Abs.' };

// tiny : semaine du gérant sur téléphone (cases étroites) — horaires sans
// la pause, libellés courts, pas de bouton × (on supprime depuis la fiche
// du créneau, qui s'ouvre au toucher).
export default function ShiftCard({
  shift, isAdmin, onClick, onDelete, compact = false, tiny = false,
  continuesPrev = false, continuesNext = false,
}) {
  const start = formatTime(shift.start_time);
  const end   = formatTime(shift.end_time);
  const type  = shift.type || 'travail';
  const isWorkShift = type === 'travail';
  // Repos : simple texte gris, répété chaque jour (pas de bandeau relié)
  const isRest = type === 'repos';
  const showLabel = isRest || !continuesPrev;

  // Première pause uniquement (la plus courante)
  const firstBreak = shift.breaks?.[0];
  const breakLabel = firstBreak
    ? `${formatTime(firstBreak.start_time)}-${formatTime(firstBreak.end_time)}`
    : null;

  // Un créneau de travail prend la couleur de son horaire type (voir
  // shiftColor.js) ; un congé/absence est gris rayé (.shift-non-work).
  const style = isWorkShift ? shiftColorVar(shift) : undefined;

  const runClass = isRest ? '' : `${continuesPrev ? ' continues-prev' : ''}${continuesNext ? ' continues-next' : ''}`;
  const nonWorkClass = isRest ? ' shift-rest' : (!isWorkShift ? ' shift-non-work' : '');

  if (compact) {
    const timeTypeClass = isWorkShift ? ' shift-colored' : '';
    return (
      <div
        className={`week-shift-badge${nonWorkClass}${timeTypeClass}${runClass}`}
        style={style}
        onClick={onClick}
        data-tooltip={isWorkShift
          ? `${start} → ${end}${breakLabel ? ` · pause ${breakLabel}` : ''}`
          : TYPE_LABELS[type]}
      >
        {isWorkShift ? (tiny ? (
          <>
            <span className="badge-start">{start}</span>
            <span className="badge-end">{end}</span>
          </>
        ) : (
          // Ordinateur (11 nov. 2026) : horaires sur une ligne, pause en
          // dessous — case moins haute, la semaine tient dans l'écran
          <>
            <span className="badge-times">{start} – {end}</span>
            {breakLabel && <span className="badge-break">Pause {breakLabel}</span>}
          </>
        )) : showLabel ? (
          <span className="badge-type-label">{(tiny ? SHORT_LABELS : TYPE_LABELS)[type]}</span>
        ) : null}
        {isAdmin && !tiny && (
          <button
            className="shift-delete-btn-inline"
            onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
            data-tooltip="Supprimer"
          >×</button>
        )}
      </div>
    );
  }

  const timeTypeClass = isWorkShift ? ' shift-colored' : '';
  return (
    <div className={`shift-card${nonWorkClass}${timeTypeClass}${runClass}`} style={style} onClick={onClick}>
      {!isWorkShift && showLabel && <div className="shift-type-tag">{TYPE_LABELS[type]}</div>}
      {isWorkShift && <div className="shift-times">{start} → {end}</div>}
      {isWorkShift && shift.breaks?.length > 0 && (
        <div className="shift-breaks">
          {shift.breaks.map((b, i) => (
            <span key={i} className="shift-break-tag">
              {b.label} {formatTime(b.start_time)}–{formatTime(b.end_time)}
            </span>
          ))}
        </div>
      )}
      {isWorkShift && (
        <div className="shift-net">
          {shift.net_hours ? `${shift.net_hours}h nettes` : ''}
        </div>
      )}
      {shift.note && <div className="shift-note">{shift.note}</div>}
      {isAdmin && (
        <button
          className="shift-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
          data-tooltip="Supprimer ce créneau"
        >×</button>
      )}
    </div>
  );
}
