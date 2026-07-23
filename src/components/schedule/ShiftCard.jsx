import { getEmployeeColor, getEmployeeColorLight } from './employeeColor';

const formatTime = (t) => t?.slice(0, 5) ?? '';

const TYPE_LABELS = { travail: 'Travail', conge: 'Congé', repos: 'Repos', absence: 'Absence' };

export default function ShiftCard({
  shift, isAdmin, onClick, onDelete, compact = false,
  continuesPrev = false, continuesNext = false,
}) {
  const start = formatTime(shift.start_time);
  const end   = formatTime(shift.end_time);
  const type  = shift.type || 'travail';
  const isWorkShift = type === 'travail';
  const showLabel = !continuesPrev;

  // Première pause uniquement (la plus courante)
  const firstBreak = shift.breaks?.[0];
  const breakLabel = firstBreak
    ? `${formatTime(firstBreak.start_time)}-${formatTime(firstBreak.end_time)}`
    : null;

  // L'identité visuelle vient de la couleur de l'employé (constante d'une
  // vue à l'autre), pas du type de créneau — moins de couleurs à l'écran.
  const empColor      = getEmployeeColor(shift.user_id);
  const empColorLight = getEmployeeColorLight(shift.user_id);
  const style = { borderLeftColor: empColor, background: empColorLight };

  const runClass = `${continuesPrev ? ' continues-prev' : ''}${continuesNext ? ' continues-next' : ''}`;
  const typeClass = !isWorkShift ? ' shift-non-work' : '';

  if (compact) {
    return (
      <div
        className={`week-shift-badge${typeClass}${runClass}`}
        style={style}
        onClick={onClick}
        data-tooltip={isWorkShift
          ? `${start} → ${end}${breakLabel ? ` · pause ${breakLabel}` : ''}`
          : TYPE_LABELS[type]}
      >
        {isWorkShift ? (
          <>
            <span className="badge-start">{start}</span>
            {breakLabel && <span className="badge-break">{breakLabel}</span>}
            <span className="badge-end">{end}</span>
          </>
        ) : showLabel ? (
          <span className="badge-type-label">{TYPE_LABELS[type]}</span>
        ) : null}
        {isAdmin && (
          <button
            className="shift-delete-btn-inline"
            onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
            data-tooltip="Supprimer"
          >×</button>
        )}
      </div>
    );
  }

  return (
    <div className={`shift-card${typeClass}${runClass}`} style={style} onClick={onClick}>
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
