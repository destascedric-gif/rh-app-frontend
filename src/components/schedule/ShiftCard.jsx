const formatTime = (t) => t?.slice(0, 5) ?? '';

const TYPE_LABELS = { travail: 'Travail', conge: 'Congé', repos: 'Repos', absence: 'Absence' };
const typeClass = (type) => type && type !== 'travail' ? ` shift-type--${type}` : '';

export default function ShiftCard({ shift, isAdmin, onClick, onDelete, compact = false }) {
  const start = formatTime(shift.start_time);
  const end   = formatTime(shift.end_time);
  const type  = shift.type || 'travail';
  const isWorkShift = type === 'travail';

  // Première pause uniquement (la plus courante)
  const firstBreak = shift.breaks?.[0];
  const breakLabel = firstBreak
    ? `${formatTime(firstBreak.start_time)}-${formatTime(firstBreak.end_time)}`
    : null;

  if (compact) {
    return (
      <div
        className={`week-shift-badge${typeClass(type)}`}
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
        ) : (
          <span className="badge-type-label">{TYPE_LABELS[type]}</span>
        )}
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
    <div className={`shift-card${typeClass(type)}`} onClick={onClick}>
      {!isWorkShift && <div className="shift-type-tag">{TYPE_LABELS[type]}</div>}
      <div className="shift-times">{start} → {end}</div>
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
