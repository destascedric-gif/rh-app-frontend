const formatTime = (t) => t?.slice(0, 5) ?? '';

export default function ShiftCard({ shift, isAdmin, onClick, onDelete, compact = false }) {
  const start = formatTime(shift.start_time);
  const end   = formatTime(shift.end_time);

  // Première pause uniquement (la plus courante)
  const firstBreak = shift.breaks?.[0];
  const breakLabel = firstBreak
    ? `${formatTime(firstBreak.start_time)}/${formatTime(firstBreak.end_time)}`
    : null;

  if (compact) {
    return (
      <div
        className="week-shift-badge"
        onClick={onClick}
        title={`${start} → ${end}${breakLabel ? ` · pause ${breakLabel}` : ''}`}
      >
        <span className="badge-start">{start}</span>
        {breakLabel && <span className="badge-break">{breakLabel}</span>}
        <span className="badge-end">→ {end}</span>
        {isAdmin && (
          <button
            className="shift-delete-btn-inline"
            onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
            title="Supprimer"
          >×</button>
        )}
      </div>
    );
  }

  return (
    <div className="shift-card" onClick={onClick}>
      <div className="shift-times">{start} → {end}</div>
      {shift.breaks?.length > 0 && (
        <div className="shift-breaks">
          {shift.breaks.map((b, i) => (
            <span key={i} className="shift-break-tag">
              {b.label} {formatTime(b.start_time)}–{formatTime(b.end_time)}
            </span>
          ))}
        </div>
      )}
      <div className="shift-net">
        {shift.net_hours ? `${shift.net_hours}h nettes` : ''}
      </div>
      {shift.note && <div className="shift-note">{shift.note}</div>}
      {isAdmin && (
        <button
          className="shift-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
          title="Supprimer ce créneau"
        >×</button>
      )}
    </div>
  );
}