const formatTime = (t) => t?.slice(0, 5) ?? '';

export default function ShiftCard({ shift, isAdmin, onClick, onDelete, compact = false }) {
  const start = formatTime(shift.start_time);
  const end   = formatTime(shift.end_time);

  if (compact) {
    return (
      <div
        className="week-shift-badge"
        onClick={onClick}
        title={`${start} → ${end}`}
      >
        <span className="badge-start">{start}</span>
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